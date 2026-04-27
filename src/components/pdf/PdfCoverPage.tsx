import { Image, Text, View } from "@react-pdf/renderer";

import genoaLogo from "../../assets/genoa-logo.png";
import type { BoardMeta } from "../../types";
import { styles } from "./pdfStyles";

interface Props {
  meta: BoardMeta;
}

export function PdfCoverPage({ meta }: Props): JSX.Element {
  const date = new Date().toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <View style={styles.cover}>
      <View style={styles.coverTopBar} />
      <Image src={genoaLogo} style={styles.coverLogo} />
      <Text style={styles.coverTitle}>{meta.title || "Shortlist"}</Text>
      {meta.seasonId ? (
        <Text style={styles.coverSeason}>{meta.seasonId}</Text>
      ) : null}
      <Text style={styles.coverDate}>{date}</Text>
      <View style={styles.coverBottomBar} />
    </View>
  );
}
