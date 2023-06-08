import {TextField} from "@consta/uikit/TextField";
import React from "react";

export const CustomTextField = (props) => {
  return <div style={{display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 5}}>
    <p style={{margin: 0}}>
      {props.text}
    </p>
    <TextField
      style={{width: "90%"}}
      min={0}
      {...props}
    />
  </div>
}