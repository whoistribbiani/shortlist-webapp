import { Image, Link, Text, View } from "@react-pdf/renderer";

import type { SlotEntry } from "../../types";
import { styles } from "./pdfStyles";

interface Props {
  slot: SlotEntry;
}

export function PdfPlayerCard({ slot }: Props): JSX.Element {
  const metaParts = [slot.club, slot.age, slot.expiring].filter(Boolean);

  return (
    <View style={styles.card}>
      {slot.playerImageUrl ? (
        <View style={styles.cardImageContainer}>
          <Image src={slot.playerImageUrl} style={styles.cardImage} />
        </View>
      ) : (
        <View style={styles.cardImageContainer} />
      )}

      <View style={styles.cardContent}>
        <View style={styles.cardTopRow}>
          {slot.teamLogoUrl ? (
            <Image src={slot.teamLogoUrl} style={styles.cardLogo} />
          ) : (
            <View />
          )}
          <Text style={styles.rankBadge}>#{slot.rank}</Text>
        </View>

        <Text style={styles.cardName}>{slot.player || slot.name}</Text>

        {metaParts.length > 0 ? (
          <Text style={styles.cardMeta}>{metaParts.join(" · ")}</Text>
        ) : null}

        {slot.videoUrl ? (
          <Link src={slot.videoUrl} style={styles.cardVideoLink}>
            Video
          </Link>
        ) : null}
      </View>
    </View>
  );
}
