import { reactExtension, Banner, useCartLines } from "@shopify/ui-extensions-react/checkout";

export default reactExtension("purchase.checkout.block.render", () => <App />);

function App() {
  const lines = useCartLines();
  const hasItem = lines.some(l => l.merchandise?.title?.toLowerCase().includes("coffee"));
  return (
    <Banner title="Complete your order">
      {hasItem
        ? "People who buy this often add Filters Pack — add one to save 10% with code AUTO-ADDED at payment."
        : "Add our Filters Pack now and unlock a 10% bundle discount at payment."}
    </Banner>
  );
}
