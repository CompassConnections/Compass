import {LovePage} from "web/components/love-page";
import ChartComponent from "web/components/widgets/charts";

export default function Charts() {
  return (
    <LovePage
      trackPageView={'charts'}
    >
      <h1 className="text-3xl font-semibold text-center mb-6">Community Growth over Time</h1>
      <ChartComponent/>
    </LovePage>
  );
}
