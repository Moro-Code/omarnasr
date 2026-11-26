import Home from "../pages/index";
import { datedSiteCopy } from "../lib/site.mjs";

const siteCopy = datedSiteCopy(new Date());

export default {
  title: "Portfolio/Home",
  component: Home,
  parameters: { layout: "fullscreen" },
  args: {
    yearsExperience: siteCopy.yearsExperience,
    copyrightYear: siteCopy.copyrightYear,
  },
};
export const Default = {};
