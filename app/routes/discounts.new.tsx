import type { ActionFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { useNavigation, Form } from "@remix-run/react";
import { Page, Layout } from "@shopify/polaris";
import DiscountForm from "~/components/DiscountForm";
import { createDiscount } from "~/models/discount.server";

export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData();
  const payload = {
    title: form.get("title") as string,
    type: form.get("type") as "PERCENTAGE" | "FIXED_AMOUNT",
    method: form.get("method") as "CODE" | "AUTOMATIC",
    value: Number(form.get("value")),
    currencyCode: (form.get("type") === "FIXED_AMOUNT" ? "USD" : undefined),
    appliesTo: {
      scope: form.get("scope") as any,
      productIds: (form.get("productIds") as string || "").split(",").map(s => s.trim()).filter(Boolean),
      collectionIds: (form.get("collectionIds") as string || "").split(",").map(s => s.trim()).filter(Boolean),
    },
    minPurchase: {
      amount: Number(form.get("minAmount")) || undefined,
      quantity: Number(form.get("minQty")) || undefined,
    },
    customerTags: (form.get("customerTags") as string || "").split(",").map(s => s.trim()).filter(Boolean),
    startsAt: (form.get("startsAt") as string) || undefined,
    endsAt: (form.get("endsAt") as string) || undefined,
    code: (form.get("code") as string) || undefined,
  };

const id = await createDiscount(request, payload as any);
return redirect(`/discounts/detail?id=${encodeURIComponent(id as string)}`);
}

export default function NewDiscount() {
  const nav = useNavigation();
  const submitting = nav.state === "submitting";
  return (
    <Page title="Create discount">
      <Layout>
        <Layout.Section>
          <Form method="post">
            <DiscountForm submitting={submitting} />
          </Form>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
