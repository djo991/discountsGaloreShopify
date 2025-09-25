import shopify from "../shopify.server";
import { json } from "@remix-run/node";
import dayjs from "dayjs";
import { z } from "zod";

export const DiscountInputSchema = z.object({
  title: z.string().min(3),
  type: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]),
  method: z.enum(["CODE", "AUTOMATIC"]),
  value: z.number().positive(),
  currencyCode: z.string().optional(), // needed for fixed amounts
  appliesTo: z.object({
    scope: z.enum(["ALL_PRODUCTS", "PRODUCTS", "COLLECTIONS"]),
    productIds: z.array(z.string()).optional(),
    collectionIds: z.array(z.string()).optional(),
  }),
  minPurchase: z.object({
    amount: z.number().optional(),
    quantity: z.number().optional(),
  }).optional(),
  // kept for future targeting UI; not used directly in basic inputs
  customerTags: z.array(z.string()).optional(),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  code: z.string().optional(), // when method === CODE
});

type DiscountInput = z.infer<typeof DiscountInputSchema>;

function buildItems(input: DiscountInput) {
  switch (input.appliesTo.scope) {
    case "ALL_PRODUCTS":
      return { all: true };
    case "PRODUCTS":
      return {
        products: {
          productsToAdd: input.appliesTo.productIds ?? [],
        },
      };
    case "COLLECTIONS":
      return {
        collections: {
          add: input.appliesTo.collectionIds ?? [],
        },
      };
  }
}

function buildValue(input: DiscountInput) {
  if (input.type === "PERCENTAGE") {
    // API expects a float 0..1 for percentage
    return { percentage: input.value / 100 };
  }
  // Fixed amount requires currency, amount as string
  const amount = input.value.toFixed(2);
  return {
    discountAmount: {
      amount,
      appliesOnEachItem: false,
    },
  };
}

function buildMinimumRequirement(input: DiscountInput) {
  if (input?.minPurchase?.amount) {
    return {
      subtotal: {
        greaterThanOrEqualToSubtotal: input.minPurchase.amount.toFixed(2),
      },
    };
  }
  if (input?.minPurchase?.quantity) {
    return {
      quantity: {
        greaterThanOrEqualToQuantity: input.minPurchase.quantity,
      },
    };
  }
  // From 2025-01 this can be null/omitted
  return undefined;
}

export async function createDiscount(request: Request, payload: DiscountInput) {
  const { admin } = await shopify.authenticate.admin(request);
  const input = DiscountInputSchema.parse(payload);

  const startsAt = input.startsAt ? dayjs(input.startsAt).toISOString() : dayjs().toISOString();
  const endsAt = input.endsAt ? dayjs(input.endsAt).toISOString() : undefined;

  const items = buildItems(input);
  const value = buildValue(input);
  const minimumRequirement = buildMinimumRequirement(input);

  if (input.method === "CODE") {
    // DiscountCodeBasicInput
    const mutation = `#graphql
      mutation CreateCodeDiscount($basic: DiscountCodeBasicInput!) {
        discountCodeBasicCreate(basicCodeDiscount: $basic) {
          codeDiscountNode { id }
          userErrors { field message code }
        }
      }
    `;
    const variables = {
      basic: {
        title: input.title,
        code: input.code ?? input.title.replace(/\s+/g, "_").toUpperCase(),
        startsAt,
        endsAt,
        combinesWith: { productDiscounts: true, orderDiscounts: true, shippingDiscounts: false },
        minimumRequirement, // nullable per docs
        customerGets: {
          items,
          value,
        },
      },
    };
    const resp = await admin.graphql(mutation, { variables });
    const data = await resp.json();
    const errors = data?.data?.discountCodeBasicCreate?.userErrors;
    if (errors?.length) throw json(errors, { status: 400 });
    return data?.data?.discountCodeBasicCreate?.codeDiscountNode?.id as string;
  }

  // AUTOMATIC basic
  const mutation = `#graphql
    mutation CreateAutomaticDiscount($auto: DiscountAutomaticBasicInput!) {
      discountAutomaticBasicCreate(automaticBasicDiscount: $auto) {
        automaticDiscountNode { id }
        userErrors { field message code }
      }
    }
  `;
  const variables = {
    auto: {
      title: input.title,
      startsAt,
      endsAt,
      combinesWith: { productDiscounts: true, orderDiscounts: true, shippingDiscounts: false },
      minimumRequirement, // nullable from 2025-01
      customerGets: {
        items,
        value,
      },
    },
  };
  const resp = await admin.graphql(mutation, { variables });
  const data = await resp.json();
  const errors = data?.data?.discountAutomaticBasicCreate?.userErrors;
  if (errors?.length) throw json(errors, { status: 400 });
  return data?.data?.discountAutomaticBasicCreate?.automaticDiscountNode?.id as string;
}

export async function listDiscounts(request: Request) {
  const { admin } = await shopify.authenticate.admin(request);
  const query = `#graphql
    query Discounts {
      discountNodes(first: 25) {
        edges {
          node {
            id
            discount {
              __typename
              ... on DiscountAutomaticBasic { title startsAt endsAt status }
              ... on DiscountCodeBasic { title startsAt endsAt status codes(first:1){nodes{code}} }
            }
          }
        }
      }
    }
  `;
  const resp = await admin.graphql(query);
  const data = await resp.json();
  return data?.data?.discountNodes?.edges?.map((e: any) => e.node) ?? [];
}

export async function getDiscountDetail(request: Request, id: string) {
  const { admin } = await shopify.authenticate.admin(request);
  const query = `#graphql
    query One($id: ID!) {
      discountNode(id: $id) {
        id
        discount {
          __typename
          ... on DiscountAutomaticBasic { title startsAt endsAt status }
          ... on DiscountCodeBasic { title startsAt endsAt status codes(first:10){nodes{code}} }
        }
      }
    }
  `;
  const resp = await admin.graphql(query, { variables: { id } });
  const data = await resp.json();
  return data?.data?.discountNode;
}
