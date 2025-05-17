import { Layout } from "@/components/layout/layout";
import { RuleTable } from "@/components/proxy/rule-table";

export default function IpAddresses() {
  return (
    <Layout title="IP Address Rules">
      <RuleTable type="ip" />
    </Layout>
  );
}
