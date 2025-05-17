import { Layout } from "@/components/layout/layout";
import { RuleTable } from "@/components/proxy/rule-table";

export default function Games() {
  return (
    <Layout title="Game Rules">
      <RuleTable type="game" />
    </Layout>
  );
}
