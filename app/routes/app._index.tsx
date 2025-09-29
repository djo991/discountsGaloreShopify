// in app/routes/app._index.tsx

import type { LoaderFunctionArgs } from "@remix-run/node";
import {
  Page,
  Text,
  Card,
  Button,
  ButtonGroup,
  BlockStack,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return null;
};

export default function AppIndex() {
  return (
    <Page title="Dashboard">
      <BlockStack gap="500">
        <Card>
          <BlockStack gap="200">
            <Text as="h1" variant="headingLg">
              Welcome to Discounts Galore
            </Text>
            <Text as="p" variant="bodyMd">
              This is your main dashboard. Choose an option below to manage
              your store's discounts.
            </Text>
          </BlockStack>
        </Card>
        <Card>
          <ButtonGroup>
            <Button url="/discounts" size="large" variant="primary">
              View Discounts
            </Button>
            <Button url="/discounts/new" size="large">
              Create New Discount
            </Button>
          </ButtonGroup>
        </Card>
      </BlockStack>
    </Page>
  );
}