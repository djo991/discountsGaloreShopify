// app/routes/discounts._index.tsx
import { LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Page, Card, ResourceList, ResourceItem, Button } from "@shopify/polaris";
import { listDiscounts } from "../models/discount.server";
import { Redirect } from "@shopify/app-bridge/actions";
import { getAppBridge } from "../utils/appBridgeClient";
import { AppProvider } from "@shopify/shopify-app-remix/react";

const STORE_HANDLE = import.meta.env.VITE_SHOPIFY_STORE_HANDLE;

const tailId = (gid: string) => gid.split("/").pop() ?? gid;

export async function loader({ request }: LoaderFunctionArgs) {
  const discounts = await listDiscounts(request);
  return json({ discounts });
}

function OpenButtons({ gid }: { gid: string }) {
  // THIS IS THE KEY: We are going back to a manual onClick handler
  const onOpen = () => {
    const app = getAppBridge();
    const path = `/discounts/detail?id=${encodeURIComponent(gid)}`;

    if (app) {
      Redirect.create(app).dispatch(Redirect.Action.APP, { path });
    }
  };

  const onOpenAdmin = () => {
    const app = getAppBridge();
    const path = `/discounts/${tailId(gid)}`;

    if (app) {
      Redirect.create(app).dispatch(Redirect.Action.ADMIN_PATH, { path });
    }
  };

  return (
    <div style={{ display: "flex", gap: 8 }}>
      <Button onClick={onOpen}>Open</Button>
      <Button onClick={onOpenAdmin}>Open in Admin</Button>
    </div>
  );
}

export default function DiscountsIndex() {
  const { discounts } = useLoaderData<typeof loader>();
  return (
    <Page title="Discounts" primaryAction={{ content: "Create", url: "/discounts/new" }}>
      <Card>
        <ResourceList
          resourceName={{ singular: "discount", plural: "discounts" }}
          items={discounts}
          renderItem={(item: any) => {
            const id = item.id;
            const title = item.discount?.title ?? "Untitled";
            const code = item.discount?.codes?.nodes?.[0]?.code;

            return (
              <ResourceItem id={id} accessibilityLabel={`View ${title}`}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{title}</div>
                    {code ? <div style={{ fontSize: 12 }}>Code: {code}</div> : null}
                  </div>

                  <OpenButtons gid={id} />
                </div>
              </ResourceItem>
            );
          }}
        />
      </Card>
    </Page>
  );
}