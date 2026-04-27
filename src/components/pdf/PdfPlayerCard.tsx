import { Image, Link, Text, View } from "@react-pdf/renderer";

import { buildPlayerImageProxyUrl } from "../../lib/scoutasticMedia";
import type { SlotEntry } from "../../types";
import { styles } from "./pdfStyles";

interface Props {
  slot: SlotEntry;
  imageProxyBaseUrl?: string;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return "?";
  return parts.length === 1
    ? (parts[0][0] ?? "?").toUpperCase()
    : ((parts[0][0] ?? "") + (parts[parts.length - 1][0] ?? "")).toUpperCase();
}

function proxyUrl(baseUrl: string | undefined, src: string): string {
  if (!src) return "";
  if (baseUrl) return buildPlayerImageProxyUrl(baseUrl, src);
  return src;
}

export function PdfPlayerCard({ slot, imageProxyBaseUrl }: Props): JSX.Element {
  const photoSrc = proxyUrl(imageProxyBaseUrl, slot.playerImageUrl);
  const logoSrc = proxyUrl(imageProxyBaseUrl, slot.teamLogoUrl);
  const displayName = slot.player || slot.name;

  return (
    <View style={styles.card}>
      <View style={styles.cardImageContainer}>
        {photoSrc ? (
          <Image src={photoSrc} style={styles.cardImage} />
        ) : (
          <Text style={styles.cardInitials}>{initials(displayName)}</Text>
        )}
      </View>

      <View style={styles.cardContent}>
        <View style={styles.cardTopRow}>
          {logoSrc ? (
            <Image src={logoSrc} style={styles.cardLogo} />
          ) : (
            <View />
          )}
          <Text style={styles.rankBadge}>#{slot.rank}</Text>
        </View>

        <Text style={styles.cardName}>{displayName}</Text>

        {slot.club ? <Text style={styles.cardMetaRow}>{slot.club}</Text> : null}
        {slot.age ? <Text style={styles.cardMetaRow}>{slot.age}</Text> : null}
        {slot.expiring ? <Text style={styles.cardMetaRow}>{slot.expiring}</Text> : null}

        {slot.videoUrl ? (
          <Link src={slot.videoUrl} style={styles.cardVideoLink}>
            Video
          </Link>
        ) : null}
      </View>
    </View>
  );
}
