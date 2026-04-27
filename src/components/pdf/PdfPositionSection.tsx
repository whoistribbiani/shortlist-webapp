import { Text, View } from "@react-pdf/renderer";

import type { PdfGrouped } from "../../lib/pdfGrouping";
import { PdfPlayerCard } from "./PdfPlayerCard";
import { styles } from "./pdfStyles";

interface Props {
  group: PdfGrouped[number];
  imageProxyBaseUrl?: string;
}

export function PdfPositionSection({ group, imageProxyBaseUrl }: Props): JSX.Element {
  return (
    <View>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderText}>{group.positionTitle}</Text>
      </View>

      <View style={styles.sectionBody}>
        {group.lanes.map((lane) => (
          <View key={lane.laneId}>
            <View style={styles.laneHeader}>
              <Text style={styles.laneHeaderText}>{lane.laneLabel}</Text>
            </View>

            {lane.scenarios.map((scenario) => (
              <View key={scenario.scenarioId}>
                <Text style={styles.scenarioLabel}>{scenario.scenarioLabel}</Text>
                <View style={styles.cardRow}>
                  {scenario.slots.map((slot) => (
                    <PdfPlayerCard
                      key={`${slot.positionId}|${slot.rank}|${slot.scenario}|${slot.lane}`}
                      slot={slot}
                      imageProxyBaseUrl={imageProxyBaseUrl}
                    />
                  ))}
                </View>
              </View>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}
