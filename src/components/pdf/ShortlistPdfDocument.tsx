import { Document, Page, Text, View } from "@react-pdf/renderer";

import type { PdfGrouped } from "../../lib/pdfGrouping";
import type { BoardMeta } from "../../types";
import "./pdfFonts";
import { PdfCoverPage } from "./PdfCoverPage";
import { PdfPositionSection } from "./PdfPositionSection";
import { styles } from "./pdfStyles";

interface Props {
  meta: BoardMeta;
  grouped: PdfGrouped;
  imageProxyBaseUrl?: string;
}

export function ShortlistPdfDocument({ meta, grouped, imageProxyBaseUrl }: Props): JSX.Element {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <PdfCoverPage meta={meta} />
      </Page>

      {grouped.length === 0 ? (
        <Page size="A4" orientation="landscape" style={styles.page}>
          <View style={styles.emptyPage}>
            <Text style={styles.emptyText}>Nessun giocatore inserito</Text>
          </View>
        </Page>
      ) : (
        grouped.map((group) => (
          <Page
            key={group.positionId}
            size="A4"
            orientation="landscape"
            style={styles.page}
          >
            <PdfPositionSection group={group} imageProxyBaseUrl={imageProxyBaseUrl} />
          </Page>
        ))
      )}
    </Document>
  );
}
