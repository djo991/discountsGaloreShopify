import { LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Page, Card, Text } from "@shopify/polaris";
import { getDiscountDetail } from "../models/discount.server";

// Try to fetch a discount node by id. If the id is numeric,
// try both Automatic and Code node GIDs.
async function resolveDiscountNode(request: Request, idOrTail: string) {
  const decoded = decodeURIComponent(idOrTail);

  // If it's already a gid://... just use it
  if (decoded.startsWith("gid://")) {
    const data = await getDiscountDetail(request, decoded);
    return { data, resolvedId: decoded };
  }

  // Otherwise, try to reconstruct both possible IDs
  const autoGid = `gid://shopify/DiscountAutomaticNode/${decoded}`;
  const codeGid = `gid://shopify/DiscountCodeNode/${decoded}`;

  let data = await getDiscountDetail(request, autoGid);
  if (!data || !data.discount) {
    data = await getDiscountDetail(request, codeGid);
    if (!data || !data.discount) return { data: null, resolvedId: null };
    return { data, resolvedId: codeGid };
  }
  return { data, resolvedId: autoGid };
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const idParam = params.id!;
  const { data, resolvedId } = await resolveDiscountNode(request, idParam);
  if (!data) throw new Response("Discount not found", { status: 404 });
  return json({ data, resolvedId, tail: idParam });
}

export default function DiscountDetail() {
  const { data, resolvedId, tail } = useLoaderData<typeof loader>();
  const title = (data?.discount as any)?.title ?? "Discount";
  const typename = (data?.discount as any)?.__typename ?? "—";
  const firstCode =
    "codes" in (data?.discount ?? {})
      ? (data?.discount as any)?.codes?.nodes?.[0]?.code ?? "—"
      : undefined;

  return (
    <Page title={title}>
      <Card>
        <Text as="p">URL tail: {tail}</Text>
        <Text as="p">Resolved GID: {resolvedId}</Text>
        <Text as="p">Type: {typename}</Text>
        {firstCode ? <Text as="p">First code: {firstCode}</Text> : null}
        <Text as="p">Starts: {(data?.discount as any)?.startsAt ?? "—"}</Text>
        <Text as="p">Ends: {(data?.discount as any)?.endsAt ?? "—"}</Text>
        <Text as="p">Status: {(data?.discount as any)?.status ?? "—"}</Text>
      </Card>
    </Page>
  );
}
