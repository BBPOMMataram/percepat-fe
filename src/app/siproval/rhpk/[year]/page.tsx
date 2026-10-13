import RhpkList from "@/components/siproval/kabalai/RhpkList";

type Props = {
  params: Promise<{ year: string }>;
};

export default async function RhpkYearPage({ params }: Props) {
  const { year } = await params;
  return <RhpkList year={year} />;
}
