import ClientOnly from "../components/ClientOnly";
import { getAppBridge } from "../utils/appBridgeClient";
//import { useAppBridge } from "@shopify/app-bridge-react";
import { Redirect } from "@shopify/app-bridge/actions";
import { LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Page, Card, Text } from "@shopify/polaris";
import { getDiscountDetail } from "../models/discount.server";
import { useEffect } from "react";
const tailId = (gid: string) => gid.split("/").pop() ?? gid;

function SyncParent({ id }: { id: string }) {
  // 3. CHANGE this to use getAppBridge()
  useEffect(() => {
    const app = getAppBridge();
    if (app) {
      const r = Redirect.create(app);
      r.dispatch(Redirect.Action.APP, `/discounts/detail?id=${encodeURIComponent(id)}`);
    }
  }, [id]);
  return null;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const idParam = url.searchParams.get("id");
  if (!idParam) throw new Response("Missing id", { status: 400 });

  const id = decodeURIComponent(idParam); // full GID expected
  const data = await getDiscountDetail(request, id);
  if (!data || !data.discount) throw new Response("Not found", { status: 404 });

  return json({ data, id });
}

export default function DiscountDetail() {
  const { data, id } = useLoaderData<typeof loader>();
  const d: any = data?.discount ?? {};
  const firstCode = "codes" in d ? d?.codes?.nodes?.[0]?.code : undefined;

  return (
    <Page title={d.title ?? "Discount"}>
      <ClientOnly>
        <SyncParent id={id} />
      </ClientOnly>
      <Card>
        <Text as="p">Node ID: {id}</Text>
        <Text as="p">Type: {d.__typename ?? "—"}</Text>
        {firstCode ? <Text as="p">First code: {firstCode}</Text> : null}
        <Text as="p">Starts: {d.startsAt ?? "—"}</Text>
        <Text as="p">Ends: {d.endsAt ?? "—"}</Text>
        <Text as="p">Status: {d.status ?? "—"}</Text>
      </Card>
    </Page>
  );
}
