import { Layout } from "@/components/layout/layout";
import { RuleTable } from "@/components/proxy/rule-table";

export default function Websites() {
  return (
    <Layout title="Website Rules">
      <RuleTable type="website" />
    </Layout>
  );
}
