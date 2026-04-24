import { FIELD_LABELS, LANES, POSITIONS, SCENARIOS, SLOT_FIELDS } from "../constants/layout";
import type { BoardState } from "../lib/boardModel";
import { buildSlotKey } from "../lib/slotKey";
import { isValidVideoUrl } from "../lib/videoUrl";
import videoCameraIcon from "../assets/video-camera.png";

interface RecapViewProps {
  state: BoardState;
}

export function RecapView({ state }: RecapViewProps): JSX.Element {
  function renderCellValue(field: (typeof SLOT_FIELDS)[number], value: string): JSX.Element | string {
    if (field !== "videoUrl") {
      return value;
    }
    const videoUrl = value.trim();
    if (!isValidVideoUrl(videoUrl)) {
      return "-";
    }
    return (
      <a
        className="recap-video-link"
        href={videoUrl}
        target="_blank"
        rel="noreferrer"
        aria-label="Apri video"
        title="Apri video"
      >
        <img src={videoCameraIcon} alt="" aria-hidden="true" />
      </a>
    );
  }

  return (
    <section className="recap-view" data-testid="recap-view">
      {POSITIONS.map((position) => (
        <article key={position.id} className="recap-block">
          <h3>
            {position.id} - {position.title}
          </h3>

          <div className="recap-table-wrap">
            <table className="recap-table">
              <thead>
                <tr>
                  <th>Info</th>
                  {SCENARIOS.map((scenario) =>
                    LANES.map((lane) => (
                      <th key={`${position.id}-${scenario.id}-${lane.id}`}>
                        {scenario.id} / {lane.label}
                      </th>
                    ))
                  )}
                </tr>
              </thead>
              <tbody>
                {SLOT_FIELDS.map((field) => (
                  <tr key={`${position.id}-${field}`}>
                    <th scope="row">{FIELD_LABELS[field]}</th>
                    {SCENARIOS.map((scenario) =>
                      LANES.map((lane) => {
                        const key = buildSlotKey({
                          positionId: position.id,
                          rank: 1,
                          scenario: scenario.id,
                          lane: lane.id
                        });
                        const slot = state[key];
                        return <td key={`${key}-${field}`}>{renderCellValue(field, slot[field])}</td>;
                      })
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      ))}
    </section>
  );
}
