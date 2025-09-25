import { useMemo, useState } from "react";
import {
  Card,
  FormLayout,
  TextField,
  Select,
  Button,
  DatePicker,
  InlineGrid,
  Text,
  BlockStack,
} from "@shopify/polaris";

export default function DiscountForm({ submitting }: { submitting?: boolean }) {
  // Controlled state
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"PERCENTAGE" | "FIXED_AMOUNT">("PERCENTAGE");
  const [method, setMethod] = useState<"CODE" | "AUTOMATIC">("CODE");
  const [value, setValue] = useState<string>("");

  const [scope, setScope] =
    useState<"ALL_PRODUCTS" | "PRODUCTS" | "COLLECTIONS">("ALL_PRODUCTS");
  const [productIds, setProductIds] = useState("");
  const [collectionIds, setCollectionIds] = useState("");

  const [minAmount, setMinAmount] = useState("");
  const [minQty, setMinQty] = useState("");
  const [customerTags, setCustomerTags] = useState("");
  const [code, setCode] = useState("");

  // Date pickers
  const now = useMemo(() => new Date(), []);
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());

  const [startsAtDate, setStartsAtDate] = useState<Date | undefined>(undefined);
  const [endsAtDate, setEndsAtDate] = useState<Date | undefined>(undefined);

  const startsAtISO = startsAtDate?.toISOString() ?? "";
  const endsAtISO = endsAtDate?.toISOString() ?? "";

  return (
    <Card>
      <FormLayout>
        <TextField
          name="title"
          label="Title"
          autoComplete="off"
          value={title}
          onChange={setTitle}
          requiredIndicator
        />

        <FormLayout.Group>
          <Select
            name="type"
            label="Discount type"
            options={[
              { label: "Percentage", value: "PERCENTAGE" },
              { label: "Fixed amount", value: "FIXED_AMOUNT" },
            ]}
            value={type}
            onChange={(v) => setType(v as typeof type)}
          />
          <Select
            name="method"
            label="Method"
            options={[
              { label: "Discount code", value: "CODE" },
              { label: "Automatic", value: "AUTOMATIC" },
            ]}
            value={method}
            onChange={(v) => setMethod(v as typeof method)}
          />
        </FormLayout.Group>

        <TextField
          name="value"
          label={type === "PERCENTAGE" ? "Percent value" : "Amount value"}
          helpText={type === "PERCENTAGE" ? "Example: 10 for 10%" : "Example: 10.00 for $10"}
          type="number"
          min={0.1}
          step={type === "PERCENTAGE" ? 0.1 : 0.01}
          value={value}
          onChange={setValue}
        />

        <Select
          name="scope"
          label="Applies to"
          options={[
            { label: "All products", value: "ALL_PRODUCTS" },
            { label: "Specific products (IDs)", value: "PRODUCTS" },
            { label: "Collections (IDs)", value: "COLLECTIONS" },
          ]}
          value={scope}
          onChange={(v) => setScope(v as typeof scope)}
        />

        {scope === "PRODUCTS" && (
          <TextField
            name="productIds"
            label="Product IDs (comma-separated, gid: or numeric)"
            value={productIds}
            onChange={setProductIds}
          />
        )}
        {scope === "COLLECTIONS" && (
          <TextField
            name="collectionIds"
            label="Collection IDs (comma-separated, gid: or numeric)"
            value={collectionIds}
            onChange={setCollectionIds}
          />
        )}

        <FormLayout.Group>
          <TextField
            name="minAmount"
            label="Min purchase amount"
            type="number"
            step={0.01}
            value={minAmount}
            onChange={setMinAmount}
          />
          <TextField
            name="minQty"
            label="Min total quantity"
            type="number"
            value={minQty}
            onChange={setMinQty}
          />
        </FormLayout.Group>

        <TextField
          name="customerTags"
          label="Customer tags (comma-separated)"
          value={customerTags}
          onChange={setCustomerTags}
          helpText="(Optional) Only relevant for future targeting; native API doesn’t directly accept tags for basic discounts."
        />

        <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
          <Card roundedAbove="sm" padding="400">
            <BlockStack gap="200">
              <Text as="h3" variant="headingSm">Starts at</Text>
              <DatePicker
                month={month}
                year={year}
                onMonthChange={(m, y) => { setMonth(m); setYear(y); }}
                selected={startsAtDate ? { start: startsAtDate, end: startsAtDate } : undefined}
                onChange={({ start }) => setStartsAtDate(start ?? undefined)}
              />
              <FormLayout.Group>
                <TextField
                  label="Selected"
                  value={startsAtDate ? startsAtDate.toLocaleString() : ""}
                  onChange={() => {}}
                  readOnly
                />
                <Button onClick={() => setStartsAtDate(undefined)} accessibilityLabel="Clear start date">
                  Clear
                </Button>
              </FormLayout.Group>
            </BlockStack>
          </Card>

          <Card roundedAbove="sm" padding="400">
            <BlockStack gap="200">
              <Text as="h3" variant="headingSm">Ends at (optional)</Text>
              <DatePicker
                month={month}
                year={year}
                onMonthChange={(m, y) => { setMonth(m); setYear(y); }}
                selected={endsAtDate ? { start: endsAtDate, end: endsAtDate } : undefined}
                onChange={({ start }) => setEndsAtDate(start ?? undefined)}
              />
              <FormLayout.Group>
                <TextField
                  label="Selected"
                  value={endsAtDate ? endsAtDate.toLocaleString() : ""}
                  onChange={() => {}}
                  readOnly
                />
                <Button onClick={() => setEndsAtDate(undefined)} accessibilityLabel="Clear end date">
                  Clear
                </Button>
              </FormLayout.Group>
            </BlockStack>
          </Card>
        </InlineGrid>

        {/* Submit ISO strings for the action */}
        <input type="hidden" name="startsAt" value={startsAtISO} />
        <input type="hidden" name="endsAt" value={endsAtISO} />

        {method === "CODE" && (
          <TextField
            name="code"
            label="Discount code"
            value={code}
            onChange={setCode}
          />
        )}

        <Button submit loading={submitting}>Create discount</Button>
      </FormLayout>
    </Card>
  );
}
