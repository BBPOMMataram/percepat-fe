import RecapTab from "@/components/siproval/kabalai/RecapTab";

type Props = {
  params: Promise<{ year: string; tab: string }>;
};

export default async function RhpkRecapTabPage({ params }: Props) {
  const { year, tab } = await params;
  return <RecapTab year={year} tab={tab} />;
}
