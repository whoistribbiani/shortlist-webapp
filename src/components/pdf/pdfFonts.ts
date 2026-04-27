import { Font } from "@react-pdf/renderer";

import LatoBlack from "../../assets/fonts/Lato-Black.ttf";
import LatoBold from "../../assets/fonts/Lato-Bold.ttf";
import LatoLight from "../../assets/fonts/Lato-Light.ttf";
import LatoRegular from "../../assets/fonts/Lato-Regular.ttf";

Font.register({
  family: "Lato",
  fonts: [
    { src: LatoLight, fontWeight: 300 },
    { src: LatoRegular, fontWeight: 400 },
    { src: LatoBold, fontWeight: 700 },
    { src: LatoBlack, fontWeight: 900 },
  ],
});
