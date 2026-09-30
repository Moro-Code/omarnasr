import React from "react";
import PageImage from "./PageImage";

export default {
  title: "Components/Molecules/PageImage",
  component: PageImage,
};

const Template = (args) => <PageImage {...args} />;

export const Primary = Template.bind({});
Primary.args = {
  image: "/vercel.svg",
  altText: "vercel logo",
  width: 300,
  height: 300,
};
