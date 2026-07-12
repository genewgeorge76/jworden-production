import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { sovereignElite } from '../logic/sovereignElite'
import legacyData from '../data/legacyPortfolio.json'

// Palantir-style minimal corporate styling for the PDF
const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', backgroundColor: '#ffffff' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottom: '2px solid #d4af37',
    paddingBottom: 10,
    marginBottom: 20,
  },
  brandTitle: { fontSize: 24, fontWeight: 'bold', color: '#0a0a0c' },
  heritage: { fontSize: 10, color: '#555555', marginTop: 4 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    backgroundColor: '#1f1f23',
    color: '#ffffff',
    padding: 5,
    marginTop: 20,
    marginBottom: 10,
  },
  text: { fontSize: 11, lineHeight: 1.5, color: '#333333', marginBottom: 10 },
  legalBox: {
    marginTop: 30,
    padding: 10,
    border: '1px solid #d4af37',
    backgroundColor: '#fdfbf7',
  },
  legalText: { fontSize: 9, color: '#666666', lineHeight: 1.4 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingTop: 10,
    borderTop: '1px solid #cccccc',
  },
  totalText: { fontSize: 16, fontWeight: 'bold' },
})

type ContractDocumentProps = {
  targetAddress: string
  totalEstimate: number
  aiProposal: string
}

export const ContractDocument = ({
  targetAddress,
  totalEstimate,
  aiProposal,
}: ContractDocumentProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <View>
          <Text style={styles.brandTitle}>J. WORDEN & SONS PAVING</Text>
          <Text style={styles.heritage}>{legacyData.heritage.title.toUpperCase()}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.text}>SUPREME COURT PRIME CONTRACTOR</Text>
          <Text style={styles.text}>EST. 1984</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>EXECUTIVE SUMMARY & SCOPE OF WORK</Text>
      <Text style={styles.text}>TARGET SITE: {targetAddress}</Text>
      <Text style={styles.text}>{aiProposal}</Text>

      <Text style={styles.sectionTitle}>VDOT COMPLIANCE METRICS</Text>
      <Text style={styles.text}>• Material: SM-9.5A Surface Mix</Text>
      <Text style={styles.text}>• Compaction Standard: 96% Marshall Density</Text>
      <Text style={styles.text}>
        • Zero-Disruption Phasing Activated for Commercial Operations.
      </Text>

      <View style={styles.totalRow}>
        <Text style={styles.totalText}>TOTAL INFRASTRUCTURE INVESTMENT:</Text>
        <Text style={styles.totalText}>${totalEstimate.toLocaleString()}</Text>
      </View>
      <Text style={{ fontSize: 10, marginTop: 5, color: '#d4af37', fontWeight: 'bold' }}>
        * 10% Stripe Deposit Required to Lock Schedule & Bypass Weather Holds.
      </Text>

      <View style={styles.legalBox}>
        <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 4 }}>
          SOVEREIGN AUTHORITY NOTICES:
        </Text>
        {sovereignElite.legal.clauses.map((clause, idx) => (
          <Text key={idx} style={styles.legalText}>
            • {clause}
          </Text>
        ))}
      </View>
    </Page>
  </Document>
)
