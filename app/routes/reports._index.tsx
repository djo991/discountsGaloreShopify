import { LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Page, Layout, Card, Text } from "@shopify/polaris";
import { basicReport } from "~/models/reports.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const report = await basicReport(request);
  return json({ report });
}

export default function Reports() {
  const { report } = useLoaderData<typeof loader>();
  return (
    <Page title="Reports">
      <Layout>
        <Layout.Section>
          <Card>
            <Text as="h2" variant="headingMd">Overview</Text>
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem", marginTop:"1rem"}}>
              <div>Impressions: {report.impressions}</div>
              <div>Redemptions: {report.redemptions}</div>
              <div>Revenue attributed: ${report.revenueAttributed.toFixed(2)}</div>
              <div>Conversion: {(report.conversionRate * 100).toFixed(2)}%</div>
            </div>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}