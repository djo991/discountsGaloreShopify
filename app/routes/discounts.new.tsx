import type { ActionFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useNavigation, Form, useActionData, useSubmit } from "@remix-run/react";
import { useAppBridge } from "@shopify/app-bridge-react";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  Text,
  TextField,
  ChoiceList,
  DatePicker,
  Box,
} from "@shopify/polaris";
import { createDiscount } from "~/models/discount.server";
import { useState, useCallback, useRef } from "react";
import { authenticate } from "../shopify.server";



export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData();

  const errors: Record<string, string> = {};
  const title = form.get("title") as string;
  const code = form.get("code") as string;
  const method = form.get("method") as "CODE" | "AUTOMATIC";
  

  if (!title) errors.title = "Title is required";
  if (method === "CODE" && !code) errors.code = "Discount code is required";

  const productIds = (form.get("productIds") as string || "").split(",").map(s => s.trim()).filter(Boolean);
  const collectionIds = (form.get("collectionIds") as string || "").split(",").map(s => s.trim()).filter(Boolean);

  let scope = "ALL_PRODUCTS";
  if (productIds.length > 0) {
    scope = "PRODUCTS";
  } else if (collectionIds.length > 0) {
    scope = "COLLECTIONS";
  }

  const payload = {
    title: form.get("title") as string,
    type: form.get("type") as "PERCENTAGE" | "FIXED_AMOUNT",
    method: form.get("method") as "CODE" | "AUTOMATIC",
    value: Number(form.get("value")),
    currencyCode: (form.get("type") === "FIXED_AMOUNT" ? "USD" : undefined),
    appliesTo: {
      scope: scope,
      productIds: productIds,
      collectionIds: collectionIds,
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
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [value, setValue] = useState("10"); // Default to a string
  const [productIds, setProductIds] = useState("");
  const [collectionIds, setCollectionIds] = useState("");

   const app = useAppBridge(); // 3. Get the App Bridge instance
  const submit = useSubmit(); // 4. Get the Remix submit function
  const formRef = useRef<HTMLFormElement>(null);


  const handleFormSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    submit(formData, { method: "post" });
  }, [submit]);

  const nav = useNavigation();
  const actionData = useActionData<typeof action>();
  const submitting = nav.state === "submitting";

  // State for form fields
  const [discountMethod, setDiscountMethod] = useState<"CODE" | "AUTOMATIC">("CODE");
  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FIXED_AMOUNT">("PERCENTAGE");
  const [{ month, year }, setDate] = useState({ month: new Date().getMonth(), year: new Date().getFullYear() });
  const [selectedDates, setSelectedDates] = useState({
    start: new Date(),
    end: new Date(),
  });

  const handleMonthChange = useCallback(
    (month: number, year: number) => setDate({ month, year }),
    [],
  );

  const primaryAction = {
    content: "Save discount",
    loading: submitting,
    disabled: submitting
  };

  return (
    <Page title="Create new discount" primaryAction={primaryAction}>
      <Form id="discount-form"
        method="post"
        ref={formRef} // 3. Attach the ref to the form
        onSubmit={handleFormSubmit}>
        <Layout>
          <Layout.Section>
            <BlockStack gap="400">
              <Card>
                <BlockStack gap="400">
                  <TextField
                    label="Discount Title"
                    name="title"
                    value={title} // Add value
                    onChange={setTitle} // Add onChange
                    autoComplete="off"
                    helpText="A name for the discount, e.g., 'Summer Sale'."
                    error={actionData?.errors?.title}
                  />
                  <ChoiceList
                    title="Method"
                    choices={[
                      { label: "Discount Code", value: "CODE" },
                      { label: "Automatic Discount", value: "AUTOMATIC" },
                    ]}
                    selected={[discountMethod]}
                    onChange={(value) => setDiscountMethod(value[0] as any)}
                  />
                  <input type="hidden" name="method" value={discountMethod} />

                  {discountMethod === "CODE" && (
                    <TextField
                      label="Discount Code"
                      name="code"
                      value={code} // Add value
                      onChange={setCode} // Add onChange
                      autoComplete="off"
                      helpText="Customers will enter this code at checkout."
                      error={actionData?.errors?.code}
                    />
                  )}
                </BlockStack>
              </Card>

              <Card>
                <BlockStack gap="400">
                  <ChoiceList
                    title="Discount Type"
                    choices={[
                      { label: "Percentage", value: "PERCENTAGE" },
                      { label: "Fixed Amount", value: "FIXED_AMOUNT" },
                    ]}
                    selected={[discountType]}
                    onChange={(value) => setDiscountType(value[0] as any)}
                  />
                  <input type="hidden" name="type" value={discountType} />
                  <TextField
                    label="Value"
                    name="value"
                    type="number"
                    value={value} // Add value
                    onChange={setValue} // Add onChange
                    prefix={discountType === "FIXED_AMOUNT" ? "$" : undefined}
                    suffix={discountType === "PERCENTAGE" ? "%" : undefined}
                    autoComplete="off"
                  />
                </BlockStack>
              </Card>

              <Card>
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">Applies to</Text>
                  <TextField
                    label="Specific Product IDs"
                    name="productIds"
                    value={productIds} // Add value
                    onChange={setProductIds} // Add onChange
                    autoComplete="off"
                    helpText="Enter product IDs, separated by commas."
                  />
                  <TextField
                    label="Specific Collection IDs"
                    name="collectionIds"
                    value={collectionIds} // Add value
                    onChange={setCollectionIds} // Add onChange
                    autoComplete="off"
                    helpText="Enter collection IDs, separated by commas."
                  />
                </BlockStack>
              </Card>
            </BlockStack>
          </Layout.Section>

          <Layout.Section variant="oneThird">
            <BlockStack gap="400">
              <Card>
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">Active Dates</Text>
                  <Box>
                    <DatePicker
                      month={month}
                      year={year}
                      onChange={setSelectedDates}
                      onMonthChange={handleMonthChange}
                      selected={selectedDates}
                      allowRange
                    />
                  </Box>
                  <input type="hidden" name="startsAt" value={selectedDates.start.toISOString()} />
                  <input type="hidden" name="endsAt" value={selectedDates.end.toISOString()} />
                </BlockStack>
              </Card>
            </BlockStack>
          </Layout.Section>
        </Layout>
      </Form>
    </Page>
  );
}