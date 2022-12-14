import {ChoiceGroup} from "@consta/uikit/ChoiceGroup";
import React from "react";

export const CustomChoiceGroup = (props) => {
  return <div style={{display: "flex", width: "100%", alignItems: "center", justifyContent: "flex-end", gap: 5}}>
    <ChoiceGroup
      style={{width: "100%"}}
      // width={"full"}
      getItemLabel={(item) => item}
      {...props}
    />
  </div>
}