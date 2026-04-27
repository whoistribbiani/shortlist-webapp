import { StyleSheet } from "@react-pdf/renderer";

const COLORS = {
  primary: "#001e32",
  secondary: "#ae1919",
  accent: "#023865",
  neutral: "#474747",
  border: "#d6d6d6",
  white: "#ffffff",
  lightGray: "#99a8b2",
};

export const styles = StyleSheet.create({
  page: {
    fontFamily: "Lato",
    backgroundColor: COLORS.white,
    padding: 0,
  },

  // Cover page
  cover: {
    flex: 1,
    backgroundColor: COLORS.primary,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  coverTopBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: COLORS.secondary,
  },
  coverBottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: COLORS.secondary,
  },
  coverLogo: {
    width: 80,
    height: 80,
    marginBottom: 24,
  },
  coverTitle: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: 700,
    marginBottom: 8,
    textAlign: "center",
  },
  coverSeason: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 300,
    marginBottom: 4,
    textAlign: "center",
  },
  coverDate: {
    color: COLORS.lightGray,
    fontSize: 11,
    fontWeight: 300,
    textAlign: "center",
  },

  // Position section
  sectionHeader: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  sectionHeaderText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 700,
  },
  sectionBody: {
    padding: 16,
  },

  // Lane header
  laneHeader: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 8,
    marginTop: 8,
  },
  laneHeaderText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 700,
  },

  // Scenario label
  scenarioLabel: {
    color: COLORS.neutral,
    fontSize: 8,
    fontWeight: 300,
    marginBottom: 6,
    marginTop: 4,
  },

  // Cards row
  cardRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 4,
  },

  // Player card
  card: {
    width: 112,
    flexDirection: "column",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    overflow: "hidden",
    backgroundColor: COLORS.white,
    marginRight: 8,
    marginBottom: 8,
  },
  cardImageContainer: {
    width: 112,
    height: 66,
    backgroundColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
  },
  cardImage: {
    width: 112,
    height: 66,
    objectFit: "cover",
  },
  cardInitials: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: 700,
  },
  cardContent: {
    padding: 5,
    flexDirection: "column",
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  cardLogo: {
    width: 14,
    height: 14,
    objectFit: "contain",
  },
  rankBadge: {
    backgroundColor: COLORS.secondary,
    color: COLORS.white,
    fontSize: 8,
    fontWeight: 700,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 2,
  },
  cardName: {
    color: COLORS.primary,
    fontSize: 9,
    fontWeight: 700,
    marginBottom: 2,
  },
  cardMetaRow: {
    color: COLORS.neutral,
    fontSize: 7,
    fontWeight: 400,
    marginBottom: 1,
  },
  cardVideoLink: {
    color: COLORS.accent,
    fontSize: 7,
    fontWeight: 400,
    textDecoration: "underline",
    marginTop: 1,
  },

  // Empty state
  emptyPage: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    color: COLORS.neutral,
    fontSize: 14,
    fontWeight: 300,
    textAlign: "center",
  },
});
