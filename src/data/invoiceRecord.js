/**
 * invoiceRecord.js — every invoice raised, from the company's own Kickserv.
 *
 * THE SOURCE
 * ──────────
 * An aging report exported from Kickserv, the job book this business ran on.
 * 256 invoices, 2014-10-08 to 2022-04-04, $4,901,990.55 in total.
 *
 * This is the single strongest evidence document in this repository, and not
 * because of its size. It corroborates, independently, records that were never
 * reconciled against it at the time:
 *
 *   THE TEXAS PROGRAMME. 13 of the 23 sites in texasProgram.js reconcile
 *   EXACTLY — 7 as single invoices and 6 only when the two-stage billing is
 *   added together. Harlingen is 26,856 + 24,336 = 51,192. Edinburg is
 *   18,720 + 18,720 = 37,440. Pharr is 34,675 + 19,000 = 53,675. Two systems,
 *   never cross-checked, agreeing to the dollar.
 *
 *   THE ADVANCE/FINAL RULE. texasProgram.js states that an advance and a final
 *   must never be summed, because Greenville reads 17,949 twice and is ONE job.
 *   This report proves it: invoices 2167 and 2113, both 17,949, same store.
 *   Summing them would have overstated Texas by hundreds of thousands.
 *
 *   THE AUTHORISATION LETTER. Don Larsen, 1400 N Lewis Ave, Waukegan, $35,575.
 *   Invoice 2342: "Don Larson KFC 1400", 35,575.00, 2017-10-31.
 *
 * WHAT THE PAYMENT COLUMN SAYS, AND WHY IT IS NOT USED
 * ───────────────────────────────────────────────────
 * The export's "Amount Paid" column reads $0.00 on 243 of 256 lines. It is NOT
 * recorded here as unpaid, and the reason is specific rather than charitable:
 * this is the same Kickserv account whose completion dates are already known to
 * be unreliable. 1,333 of its 2,610 jobs carry no completion date, and the
 * owner's account — given before this document existed — is that the work was
 * finished and the box was never ticked. He states the same of payment: the
 * invoices were paid in full and the system was never updated.
 *
 * That is consistent with what the file looks like. A business that collected
 * nothing on 243 consecutive invoices across eight years does not keep
 * operating, and this one did.
 *
 * So the amounts below are graded `invoiced`, which is what the document
 * actually establishes: work performed and billed. Payment status is not
 * recorded either way and MUST NOT be published in either direction. No
 * contractor's website states whether its invoices cleared, and this one will
 * not become the first.
 *
 * WHAT MAY BE SAID FROM THIS FILE
 * ───────────────────────────────
 *   "$4,901,990.55 invoiced across 256 invoices, 2014-2022"        yes
 *   "$4,082,440.23 in KFC restaurant work for KBP Foods"          yes
 *   "we earned / collected / were paid ..."            NO — not from this
 *   "outstanding receivables of ..."                   NO — not from this
 */

/** Grade for everything in this file. The top of the evidence ladder. */
export const EVIDENCE = 'invoiced'

export const INVOICE_COUNT = 256
export const INVOICED_TOTAL_USD = 4901990.550000001
export const KFC_INVOICE_COUNT = 146
export const KFC_INVOICED_USD = 4082440.23
export const FIRST_INVOICE = '2014-10-08'
export const LAST_INVOICE = '2022-04-04'

/** Invoices per calendar year, for shape rather than for a headline. */
export const INVOICES_BY_YEAR = {
  "2014": 3,
  "2015": 46,
  "2016": 79,
  "2017": 93,
  "2018": 25,
  "2019": 5,
  "2020": 4,
  "2022": 1
}

/**
 * Every line, oldest first. Customer names are as typed into Kickserv.
 *
 * NOTE ON PRIVACY: residential customers appear here by personal name because
 * that is how the invoice was raised. This file is DATA, not page content.
 * Nothing may render a private individual's name and job value on a public
 * page — see the residential privacy rule applied throughout this repository.
 * Only the aggregate figures above, and the named commercial clients, are
 * publishable.
 */
export const INVOICES = [
  { invoice: '759', customer: 'S & n communications', job: 'Service', date: '2014-10-08', amountUsd: 550.0 },
  { invoice: '834', customer: 'Sandra Francisco', job: 'Asphalt Seal Coating', date: '2014-12-06', amountUsd: 275.0 },
  { invoice: '835', customer: 'Hamilton & Mitchell and assc', job: 'Brick Pavers', date: '2014-12-16', amountUsd: 250.0 },
  { invoice: '850', customer: 'Patrick Perry', job: 'Asphalt Paving', date: '2015-02-02', amountUsd: 11500.0 },
  { invoice: '865', customer: 'Meckley Services Inc.', job: 'Other Service', date: '2015-02-17', amountUsd: 1580.0 },
  { invoice: '866', customer: 'Meckley Services Inc.', job: 'Other Service', date: '2015-02-17', amountUsd: 395.0 },
  { invoice: '874', customer: 'Meckley Services Inc.', job: 'Other Service', date: '2015-02-19', amountUsd: 395.0 },
  { invoice: '876', customer: 'Meckley Services Inc.', job: 'Other Service', date: '2015-02-19', amountUsd: 395.0 },
  { invoice: '893', customer: 'Meckley Services Inc.', job: 'Other Service', date: '2015-02-20', amountUsd: 395.0 },
  { invoice: '883', customer: 'Meckley Services Inc.', job: 'Other Service', date: '2015-02-20', amountUsd: 395.0 },
  { invoice: '880', customer: 'Meckley Services Inc.', job: 'Other Service', date: '2015-02-20', amountUsd: 395.0 },
  { invoice: '878', customer: 'Meckley Services Inc.', job: 'Other Service', date: '2015-02-20', amountUsd: 450.0 },
  { invoice: '884', customer: 'Meckley Services Inc.', job: 'Other Service', date: '2015-02-20', amountUsd: 395.0 },
  { invoice: '892', customer: 'Meckley Services Inc.', job: 'Other Service', date: '2015-02-20', amountUsd: 395.0 },
  { invoice: '877', customer: 'Meckley Services Inc.', job: 'Other Service', date: '2015-02-20', amountUsd: 450.0 },
  { invoice: '879', customer: 'Meckley Services Inc.', job: 'Other Service', date: '2015-02-20', amountUsd: 395.0 },
  { invoice: '882', customer: 'Meckley Services Inc.', job: 'Other Service', date: '2015-02-20', amountUsd: 395.0 },
  { invoice: '885', customer: 'Meckley Services Inc.', job: 'Other Service', date: '2015-02-20', amountUsd: 395.0 },
  { invoice: '886', customer: 'Meckley Services Inc.', job: 'Other Service', date: '2015-02-20', amountUsd: 395.0 },
  { invoice: '887', customer: 'Meckley Services Inc.', job: 'Other Service', date: '2015-02-20', amountUsd: 395.0 },
  { invoice: '888', customer: 'Meckley Services Inc.', job: 'Other Service', date: '2015-02-20', amountUsd: 395.0 },
  { invoice: '889', customer: 'Meckley Services Inc.', job: 'Other Service', date: '2015-02-20', amountUsd: 395.0 },
  { invoice: '890', customer: 'Meckley Services Inc.', job: 'Other Service', date: '2015-02-20', amountUsd: 395.0 },
  { invoice: '891', customer: 'Meckley Services Inc.', job: 'Other Service', date: '2015-02-20', amountUsd: 395.0 },
  { invoice: '894', customer: 'KBP Foods', job: 'Other Service', date: '2015-02-20', amountUsd: 3250.0 },
  { invoice: '272', customer: 'Robert Steel', job: 'Asphalt Paving', date: '2015-03-13', amountUsd: 3260.0 },
  { invoice: '906', customer: 'Del Ward', job: 'Asphalt Paving', date: '2015-03-29', amountUsd: 3300.0 },
  { invoice: '857', customer: 'Art Phaup', job: 'Asphalt Paving', date: '2015-03-29', amountUsd: 4100.0 },
  { invoice: '952', customer: 'Ken Cloud', job: 'Asphalt Seal Coating', date: '2015-04-02', amountUsd: 1000.0 },
  { invoice: '916', customer: 'Brandon Hedrick', job: 'Chip and tar', date: '2015-04-07', amountUsd: 23500.0 },
  { invoice: '986', customer: 'Emily hare', job: 'Asphalt Paving', date: '2015-04-22', amountUsd: 2050.0 },
  { invoice: '985', customer: 'Rick Snellingburger', job: 'Asphalt Paving', date: '2015-04-25', amountUsd: 3600.0 },
  { invoice: '1017', customer: 'Jeffry Jenkins', job: 'Asphalt Paving', date: '2015-05-07', amountUsd: 4125.0 },
  { invoice: '1045', customer: 'wgl 111', job: 'Asphalt Seal Coating', date: '2015-05-08', amountUsd: 375.0 },
  { invoice: '1057', customer: 'Bulifant Properties', job: 'Asphalt Paving', date: '2015-05-11', amountUsd: 1500.0 },
  { invoice: '1073', customer: 'Saint Clair Homes Inc', job: 'Asphalt Paving', date: '2015-05-13', amountUsd: 4400.0 },
  { invoice: '1074', customer: 'FRANK VAN KEUREN', job: 'Asphalt Seal Coating', date: '2015-05-14', amountUsd: 450.0 },
  { invoice: '1173', customer: '360 on site construction', job: 'Other Service', date: '2015-06-04', amountUsd: 2777.0 },
  { invoice: '1198', customer: '360 on site construction', job: 'Other Service', date: '2015-06-11', amountUsd: 10000.0 },
  { invoice: '1227', customer: '360 on site construction', job: 'Other Service', date: '2015-06-25', amountUsd: 15000.0 },
  { invoice: '1245', customer: '360 on site construction', job: 'Other Service', date: '2015-07-07', amountUsd: 12000.0 },
  { invoice: '1266', customer: 'Solomonduke09@aim.com', job: 'Asphalt Paving', date: '2015-07-15', amountUsd: 5850.0 },
  { invoice: '1273', customer: 'Adriana Salmeron', job: 'Asphalt Paving', date: '2015-07-16', amountUsd: 2800.0 },
  { invoice: '1352', customer: 'mr hughes', job: 'Other Service', date: '2015-08-12', amountUsd: 850.0 },
  { invoice: '950', customer: 'Enclave apartments', job: 'Asphalt Paving', date: '2015-08-17', amountUsd: 11650.0 },
  { invoice: '1381', customer: 'James River Construction', job: 'Asphalt Paving', date: '2015-08-20', amountUsd: 9246.67 },
  { invoice: '1588', customer: 'Chick-Fil-A', job: 'Asphalt Paving', date: '2015-10-30', amountUsd: 850.0 },
  { invoice: '1673', customer: 'W R Robins', job: 'Asphalt Seal Coating', date: '2015-12-18', amountUsd: 600.0 },
  { invoice: '1623', customer: 'Franco custom building', job: 'Asphalt Paving', date: '2015-12-21', amountUsd: 7500.0 },
  { invoice: '1635', customer: 'Steve Kramen', job: 'Asphalt Seal Coating', date: '2016-01-11', amountUsd: 280.0 },
  { invoice: '1723', customer: 'Franco custom building', job: 'Asphalt Paving', date: '2016-01-21', amountUsd: 2500.0 },
  { invoice: '1756', customer: 'sister nancay primitive babtistchurch', job: 'parking lot rehab', date: '2016-02-10', amountUsd: 1250.0 },
  { invoice: '1739', customer: 'Carey Godwin', job: 'Asphalt Seal Coating', date: '2016-02-12', amountUsd: 650.0 },
  { invoice: '1776', customer: 'Glade Road Properties, LLC', job: 'parking lot rehab', date: '2016-02-22', amountUsd: 1000.0 },
  { invoice: '1798', customer: 'Coastal Maintainance', job: 'Asphalt Paving', date: '2016-03-02', amountUsd: 25950.0 },
  { invoice: '1797', customer: 'Coastal Maintainance', job: 'Asphalt Paving', date: '2016-03-02', amountUsd: 14500.0 },
  { invoice: '1672', customer: 'Gus Nikiforol', job: 'Asphalt Paving', date: '2016-03-21', amountUsd: 7500.0 },
  { invoice: '1835', customer: 'Wichello LLC', job: 'Asphalt Paving', date: '2016-03-22', amountUsd: 4800.0 },
  { invoice: '1802', customer: 'Atlantic Foundations', job: 'Asphalt Paving', date: '2016-03-30', amountUsd: 59250.0 },
  { invoice: '1849', customer: 'H.C Yu', job: 'Brick Pavers', date: '2016-04-08', amountUsd: 6000.0 },
  { invoice: '1500', customer: 'Carol Fike', job: 'Asphalt Paving', date: '2016-04-21', amountUsd: 10000.0 },
  { invoice: '1652', customer: 'O\'reillys auto parts', job: 'Asphalt Paving', date: '2016-04-26', amountUsd: 6400.0 },
  { invoice: '1478', customer: 'windsor business park', job: 'Asphalt Paving', date: '2016-05-12', amountUsd: 20125.0 },
  { invoice: '1804', customer: 'Rite Aid 1594', job: 'parking lot rehab', date: '2016-06-03', amountUsd: 26430.0 },
  { invoice: '1968', customer: 'William Lane', job: 'Asphalt Paving', date: '2016-06-16', amountUsd: 6700.0 },
  { invoice: '1971', customer: 'ABUCK Inc', job: 'Asphalt Paving', date: '2016-06-17', amountUsd: 5200.0 },
  { invoice: '1943', customer: 'KFC 5362 - Detroit', job: 'parking lot rehab', date: '2016-06-20', amountUsd: 23040.0 },
  { invoice: '1939', customer: 'KFC - 5370 - Grand Blanc', job: 'parking lot rehab', date: '2016-06-20', amountUsd: 30780.0 },
  { invoice: '1940', customer: 'KFC - 5381 South Dort Hwy', job: 'parking lot rehab', date: '2016-06-21', amountUsd: 66980.0 },
  { invoice: '2003', customer: 'KFC--Tucker', job: 'parking lot rehab', date: '2016-08-15', amountUsd: 30280.0 },
  { invoice: '2026', customer: 'KFC (105)', job: 'Concrete', date: '2016-08-15', amountUsd: 4500.0 },
  { invoice: '2027', customer: 'KFC-- Atlanta Sign Work', job: 'Other Service', date: '2016-08-15', amountUsd: 4300.0 },
  { invoice: '2032', customer: 'Wichello LLC', job: 'Asphalt Paving', date: '2016-08-19', amountUsd: 6500.0 },
  { invoice: '2031', customer: 'Wichello LLC', job: 'Asphalt Paving', date: '2016-08-19', amountUsd: 3000.0 },
  { invoice: '2039', customer: 'Bob Broyle', job: 'Asphalt Paving', date: '2016-08-29', amountUsd: 3800.0 },
  { invoice: '2053', customer: 'Rudds Trailer Park', job: 'Other Service', date: '2016-09-12', amountUsd: 5500.0 },
  { invoice: '2002', customer: 'KFC Delk Rd SE', job: 'parking lot rehab', date: '2016-09-14', amountUsd: 10210.0 },
  { invoice: '2000', customer: 'KFC--Bouldercrest', job: 'Asphalt Seal Coating', date: '2016-09-14', amountUsd: 9210.0 },
  { invoice: '2062', customer: 'KFC (84)', job: 'Concrete', date: '2016-09-28', amountUsd: 6970.0 },
  { invoice: '1822', customer: 'KFC Acworth #2', job: 'parking lot rehab', date: '2016-10-01', amountUsd: 24000.0 },
  { invoice: '2063', customer: 'KFC Clio', job: 'parking lot rehab', date: '2016-10-04', amountUsd: 58250.0 },
  { invoice: '2077', customer: 'KFC(272)', job: 'parking lot rehab', date: '2016-10-08', amountUsd: 18750.0 },
  { invoice: '2068', customer: 'KFC(003)', job: 'parking lot rehab', date: '2016-10-08', amountUsd: 13225.0 },
  { invoice: '2070', customer: 'KFC(004)', job: 'parking lot rehab', date: '2016-10-08', amountUsd: 14450.0 },
  { invoice: '2072', customer: 'KFC(005)', job: 'parking lot rehab', date: '2016-10-08', amountUsd: 19628.5 },
  { invoice: '2074', customer: 'KFC(006)', job: 'parking lot rehab', date: '2016-10-08', amountUsd: 22227.5 },
  { invoice: '2075', customer: 'KFC(206)', job: 'parking lot rehab', date: '2016-10-08', amountUsd: 8900.0 },
  { invoice: '2076', customer: 'KFC(270)', job: 'parking lot rehab', date: '2016-10-08', amountUsd: 16000.0 },
  { invoice: '2078', customer: 'KFC(273)', job: 'parking lot rehab', date: '2016-10-08', amountUsd: 32297.5 },
  { invoice: '2079', customer: 'KFC(277)', job: 'parking lot rehab', date: '2016-10-08', amountUsd: 22115.0 },
  { invoice: '2065', customer: 'KFC(002)', job: 'parking lot rehab', date: '2016-10-08', amountUsd: 14417.5 },
  { invoice: '2067', customer: 'KFC(001)', job: 'parking lot rehab', date: '2016-10-08', amountUsd: 18719.5 },
  { invoice: '2045', customer: 'KFC-- Stockbridge', job: 'Concrete', date: '2016-10-17', amountUsd: 6900.0 },
  { invoice: '2084', customer: 'Nhan', job: 'Asphalt Paving', date: '2016-10-20', amountUsd: 1000.0 },
  { invoice: '2082', customer: 'Paul Palisano', job: 'Asphalt Paving', date: '2016-10-20', amountUsd: 4600.0 },
  { invoice: '2085', customer: 'Bon vi vant', job: 'parking lot rehab', date: '2016-10-24', amountUsd: 45000.0 },
  { invoice: '2089', customer: 'Mr. Brackett', job: 'Other Service', date: '2016-10-29', amountUsd: 11000.0 },
  { invoice: '1996', customer: 'KFC--Jackson', job: 'Asphalt Seal Coating', date: '2016-11-03', amountUsd: 9420.0 },
  { invoice: '1998', customer: 'KFC--Cartersville', job: 'Asphalt Seal Coating', date: '2016-11-03', amountUsd: 10080.0 },
  { invoice: '2092', customer: 'KFC(211)', job: 'parking lot rehab', date: '2016-11-09', amountUsd: 24336.0 },
  { invoice: '2095', customer: 'KFC(232)', job: 'parking lot rehab', date: '2016-11-09', amountUsd: 13884.0 },
  { invoice: '2100', customer: 'KFC(229)', job: 'parking lot rehab', date: '2016-11-09', amountUsd: 18720.0 },
  { invoice: '2099', customer: 'KFC(238)', job: 'parking lot rehab', date: '2016-11-09', amountUsd: 19000.0 },
  { invoice: '2098', customer: 'KFC(239)', job: 'parking lot rehab', date: '2016-11-09', amountUsd: 18250.0 },
  { invoice: '2097', customer: 'KFC(220)', job: 'parking lot rehab', date: '2016-11-09', amountUsd: 11356.0 },
  { invoice: '2096', customer: 'KFC(235)', job: 'parking lot rehab', date: '2016-11-09', amountUsd: 15510.0 },
  { invoice: '2094', customer: 'KFC(230)', job: 'parking lot rehab', date: '2016-11-09', amountUsd: 16240.0 },
  { invoice: '2093', customer: 'KFC(213)', job: 'parking lot rehab', date: '2016-11-09', amountUsd: 14400.0 },
  { invoice: '2071', customer: 'KFC(005)', job: 'parking lot rehab', date: '2016-11-11', amountUsd: 36689.0 },
  { invoice: '2104', customer: 'KFC(002)', job: 'parking lot rehab', date: '2016-11-11', amountUsd: 24412.5 },
  { invoice: '2101', customer: 'KFC(277)', job: 'parking lot rehab', date: '2016-11-11', amountUsd: 24615.0 },
  { invoice: '2103', customer: 'KFC(270)', job: 'parking lot rehab', date: '2016-11-11', amountUsd: 41000.0 },
  { invoice: '2113', customer: 'KFC(209)', job: 'parking lot rehab', date: '2016-11-13', amountUsd: 17949.0 },
  { invoice: '2112', customer: 'KFC(236)', job: 'parking lot rehab', date: '2016-11-13', amountUsd: 18719.0 },
  { invoice: '2110', customer: 'KFC(233)', job: 'parking lot rehab', date: '2016-11-13', amountUsd: 25621.0 },
  { invoice: '2108', customer: 'KFC(237)', job: 'parking lot rehab', date: '2016-11-13', amountUsd: 24821.0 },
  { invoice: '2106', customer: 'KFC(212)', job: 'parking lot rehab', date: '2016-11-13', amountUsd: 22894.0 },
  { invoice: '2116', customer: 'KFC(303)', job: 'parking lot rehab', date: '2016-11-14', amountUsd: 34729.0 },
  { invoice: '2114', customer: 'KFC(304)', job: 'parking lot rehab', date: '2016-11-14', amountUsd: 46228.0 },
  { invoice: '2119', customer: 'Mark Hill Builders', job: 'Asphalt Paving', date: '2016-11-17', amountUsd: 4200.0 },
  { invoice: '2120', customer: 'KFC(272)', job: 'parking lot rehab', date: '2016-11-28', amountUsd: 18750.0 },
  { invoice: '2123', customer: 'L2 Construction Services', job: 'Asphalt Paving', date: '2016-11-28', amountUsd: 22596.0 },
  { invoice: '2122', customer: 'KFC (380)', job: 'Other Service', date: '2016-11-28', amountUsd: 3540.0 },
  { invoice: '2121', customer: 'KFC(366)', job: 'Other Service', date: '2016-11-28', amountUsd: 3500.0 },
  { invoice: '1999', customer: 'KFC--Greenbriar', job: 'Asphalt Seal Coating', date: '2016-11-28', amountUsd: 9120.0 },
  { invoice: '2127', customer: 'KFC(238)', job: 'parking lot rehab', date: '2016-12-20', amountUsd: 34675.0 },
  { invoice: '2126', customer: 'KFC(232)', job: 'parking lot rehab', date: '2016-12-20', amountUsd: 15321.0 },
  { invoice: '2125', customer: 'KFC(211)', job: 'parking lot rehab', date: '2016-12-20', amountUsd: 26856.0 },
  { invoice: '2117', customer: 'Riteaid3691', job: 'Other Service', date: '2017-01-04', amountUsd: 4000.0 },
  { invoice: '2135', customer: 'KFC(235)', job: 'parking lot rehab', date: '2017-01-18', amountUsd: 19320.0 },
  { invoice: '2136', customer: 'KFC(262)', job: 'parking lot rehab', date: '2017-01-20', amountUsd: 34786.0 },
  { invoice: '2141', customer: 'KFC(240)', job: 'parking lot rehab', date: '2017-02-01', amountUsd: 26372.0 },
  { invoice: '2143', customer: 'KFC(229)', job: 'parking lot rehab', date: '2017-02-10', amountUsd: 18720.0 },
  { invoice: '2144', customer: 'KS Maintenance', job: 'Other Service', date: '2017-02-14', amountUsd: 200.0 },
  { invoice: '2158', customer: 'KFC (Tyler, TX)', job: 'parking lot rehab', date: '2017-02-20', amountUsd: 7645.0 },
  { invoice: '2157', customer: 'KFC(231)', job: 'parking lot rehab', date: '2017-02-20', amountUsd: 23345.0 },
  { invoice: '2149', customer: 'KFC(236)', job: 'parking lot rehab', date: '2017-02-20', amountUsd: 18719.0 },
  { invoice: '2107', customer: 'KFC(237)', job: 'parking lot rehab', date: '2017-02-20', amountUsd: 10858.0 },
  { invoice: '2162', customer: 'KBP Foods', job: 'Other Service', date: '2017-02-23', amountUsd: 87000.0 },
  { invoice: '2164', customer: 'KFC(216)', job: 'parking lot rehab', date: '2017-02-26', amountUsd: 11278.0 },
  { invoice: '2163', customer: 'KFC(210)', job: 'parking lot rehab', date: '2017-02-27', amountUsd: 19678.0 },
  { invoice: '2167', customer: 'KFC(209)', job: 'parking lot rehab', date: '2017-03-07', amountUsd: 17949.0 },
  { invoice: '2166', customer: 'KFC Waco Loop', job: 'parking lot rehab', date: '2017-03-07', amountUsd: 53478.0 },
  { invoice: '867', customer: 'Wanda Garrard', job: 'Asphalt Paving', date: '2017-03-09', amountUsd: 6250.0 },
  { invoice: '830', customer: 'Ryan Smith', job: 'Asphalt Paving', date: '2017-03-17', amountUsd: 13500.0 },
  { invoice: '2176', customer: 'KFC(227)', job: 'parking lot rehab', date: '2017-03-21', amountUsd: 17310.0 },
  { invoice: '2169', customer: 'Adamson Development', job: 'parking lot rehab', date: '2017-04-05', amountUsd: 11254.0 },
  { invoice: '2192', customer: 'KFC (021)', job: 'Asphalt Paving', date: '2017-04-07', amountUsd: 19761.0 },
  { invoice: '2190', customer: 'KFC (254)', job: 'Asphalt Paving', date: '2017-04-07', amountUsd: 38716.0 },
  { invoice: '2189', customer: 'KFC (256)', job: 'Asphalt Paving', date: '2017-04-07', amountUsd: 36500.0 },
  { invoice: '2193', customer: 'KFC (256)', job: 'Asphalt Paving', date: '2017-04-17', amountUsd: 36500.0 },
  { invoice: '2194', customer: 'KFC (254)', job: 'Asphalt Paving', date: '2017-04-17', amountUsd: 77432.0 },
  { invoice: '2186', customer: 'KFC(85)', job: 'parking lot rehab', date: '2017-04-19', amountUsd: 9243.0 },
  { invoice: '2195', customer: 'KFC(85)', job: 'Asphalt Seal Coating', date: '2017-04-19', amountUsd: 6400.0 },
  { invoice: '2198', customer: 'KFC (243)', job: 'parking lot rehab', date: '2017-04-21', amountUsd: 29228.0 },
  { invoice: '2205', customer: 'KFC(333)', job: 'parking lot rehab', date: '2017-05-01', amountUsd: 8827.0 },
  { invoice: '2208', customer: 'KFC(382)', job: 'parking lot rehab', date: '2017-05-01', amountUsd: 12741.0 },
  { invoice: '2207', customer: 'KFC (336)', job: 'parking lot rehab', date: '2017-05-01', amountUsd: 20127.0 },
  { invoice: '2206', customer: 'KFC (335)', job: 'parking lot rehab', date: '2017-05-01', amountUsd: 13392.0 },
  { invoice: '2204', customer: 'KFC (331)', job: 'parking lot rehab', date: '2017-05-01', amountUsd: 13299.0 },
  { invoice: '2203', customer: 'KCF (330)', job: 'parking lot rehab', date: '2017-05-01', amountUsd: 14226.0 },
  { invoice: '2202', customer: 'KFC (305)', job: 'parking lot rehab', date: '2017-05-01', amountUsd: 10237.5 },
  { invoice: '2201', customer: 'KFC (302)', job: 'Asphalt Seal Coating', date: '2017-05-01', amountUsd: 3750.0 },
  { invoice: '2200', customer: 'KFC (301)', job: 'parking lot rehab', date: '2017-05-01', amountUsd: 18710.5 },
  { invoice: '2214', customer: 'KFC (260)', job: 'parking lot rehab', date: '2017-05-05', amountUsd: 6330.0 },
  { invoice: '2211', customer: 'KFC (243)', job: 'parking lot rehab', date: '2017-05-05', amountUsd: 29228.0 },
  { invoice: '1852', customer: 'Michelle White', job: 'Asphalt Paving', date: '2017-06-01', amountUsd: 4700.0 },
  { invoice: '2236', customer: 'KFC (190)', job: 'parking lot rehab', date: '2017-06-06', amountUsd: 52077.31 },
  { invoice: '2252', customer: 'KFC (260)', job: 'parking lot rehab', date: '2017-06-19', amountUsd: 6330.0 },
  { invoice: '2251', customer: 'KFC (013)', job: 'parking lot rehab', date: '2017-06-19', amountUsd: 7400.0 },
  { invoice: '2226', customer: 'KFC (162)', job: 'parking lot rehab', date: '2017-06-28', amountUsd: 30792.16 },
  { invoice: '2261', customer: 'KFC (195)', job: 'parking lot rehab', date: '2017-07-24', amountUsd: 54189.0 },
  { invoice: '2280', customer: 'KFC (367)', job: 'parking lot rehab', date: '2017-08-12', amountUsd: 39859.0 },
  { invoice: '2199', customer: 'KFC(268)', job: 'parking lot rehab', date: '2017-08-12', amountUsd: 36531.0 },
  { invoice: '2223', customer: 'KFC (155)', job: 'parking lot rehab', date: '2017-09-10', amountUsd: 39012.0 },
  { invoice: '2225', customer: 'KFC (153)', job: 'parking lot rehab', date: '2017-09-17', amountUsd: 47124.0 },
  { invoice: '2312', customer: 'KFC (023)', job: 'parking lot rehab', date: '2017-09-17', amountUsd: 48510.0 },
  { invoice: '2311', customer: 'KFC (368)', job: 'parking lot rehab', date: '2017-09-17', amountUsd: 33415.0 },
  { invoice: '2309', customer: 'KFC (380)', job: 'parking lot rehab', date: '2017-09-17', amountUsd: 22864.0 },
  { invoice: '2306', customer: 'KFC (385)', job: 'parking lot rehab', date: '2017-09-25', amountUsd: 34894.0 },
  { invoice: '2307', customer: 'KFC(137)', job: 'parking lot rehab', date: '2017-09-25', amountUsd: 43212.0 },
  { invoice: '2283', customer: 'KFC (376)', job: 'parking lot rehab', date: '2017-09-25', amountUsd: 26846.0 },
  { invoice: '2220', customer: 'KFC (143)', job: 'parking lot rehab', date: '2017-10-02', amountUsd: 16635.67 },
  { invoice: '2317', customer: 'KFC (157)', job: 'parking lot rehab', date: '2017-10-02', amountUsd: 24200.0 },
  { invoice: '2224', customer: 'KFC (132)', job: 'parking lot rehab', date: '2017-10-02', amountUsd: 36005.0 },
  { invoice: '2221', customer: 'KFC (160)', job: 'parking lot rehab', date: '2017-10-02', amountUsd: 7852.0 },
  { invoice: '2322', customer: 'KFC (161)', job: 'parking lot rehab', date: '2017-10-09', amountUsd: 19293.39 },
  { invoice: '2315', customer: 'KFC (134)', job: 'parking lot rehab', date: '2017-10-09', amountUsd: 39720.0 },
  { invoice: '2327', customer: 'KFC (278)', job: 'parking lot rehab', date: '2017-10-10', amountUsd: 35794.0 },
  { invoice: '2329', customer: 'KFC Des Plaines', job: 'parking lot rehab', date: '2017-10-17', amountUsd: 38493.0 },
  { invoice: '2330', customer: 'KFC (020)', job: 'parking lot rehab', date: '2017-10-17', amountUsd: 189966.0 },
  { invoice: '2334', customer: 'KFC-- Boilingbrook', job: 'parking lot rehab', date: '2017-10-24', amountUsd: 23880.0 },
  { invoice: '2333', customer: 'KFC--Aurora', job: 'parking lot rehab', date: '2017-10-24', amountUsd: 34742.0 },
  { invoice: '2331', customer: 'Don Larson', job: 'parking lot rehab', date: '2017-10-24', amountUsd: 34742.0 },
  { invoice: '2332', customer: 'Don Larson', job: 'parking lot rehab', date: '2017-10-24', amountUsd: 34742.0 },
  { invoice: '2341', customer: 'Michael George', job: 'Asphalt Seal Coating', date: '2017-10-28', amountUsd: 3450.0 },
  { invoice: '2340', customer: 'Jimmy Brown', job: 'Asphalt Seal Coating', date: '2017-10-28', amountUsd: 400.0 },
  { invoice: '2343', customer: 'KBP Foods', job: 'parking lot rehab', date: '2017-10-31', amountUsd: 14550.0 },
  { invoice: '2342', customer: 'Don Larson KFC 1400', job: 'Other Service', date: '2017-10-31', amountUsd: 35575.0 },
  { invoice: '2348', customer: 'Joe Schmidt KFC 2240', job: 'Other Service', date: '2017-11-03', amountUsd: 475.0 },
  { invoice: '2347', customer: 'Joe Schmidt KFC 335', job: 'Other Service', date: '2017-11-03', amountUsd: 475.0 },
  { invoice: '2346', customer: 'Joe Schmidt KFC 2221', job: 'Other Service', date: '2017-11-03', amountUsd: 475.0 },
  { invoice: '2345', customer: 'Joe Schmidt KFC 1450', job: 'Other Service', date: '2017-11-03', amountUsd: 475.0 },
  { invoice: '2344', customer: 'Joe Schmitt KFC 3028', job: 'Other Service', date: '2017-11-03', amountUsd: 475.0 },
  { invoice: '2351', customer: 'KFC--NW Topeka', job: 'parking lot rehab', date: '2017-11-06', amountUsd: 11184.0 },
  { invoice: '2350', customer: 'KFC--SW Topeka', job: 'parking lot rehab', date: '2017-11-06', amountUsd: 33206.0 },
  { invoice: '2349', customer: 'KFC--Lawrence KS', job: 'parking lot rehab', date: '2017-11-06', amountUsd: 27024.0 },
  { invoice: '2352', customer: 'KFC 355', job: 'parking lot rehab', date: '2017-11-20', amountUsd: 19284.0 },
  { invoice: '2324', customer: 'KFC (139)', job: 'parking lot rehab', date: '2017-11-20', amountUsd: 21281.0 },
  { invoice: '2316', customer: 'KFC (128)', job: 'parking lot rehab', date: '2017-11-20', amountUsd: 42681.0 },
  { invoice: '2325', customer: 'KFC(151)', job: 'parking lot rehab', date: '2017-11-21', amountUsd: 20457.0 },
  { invoice: '2357', customer: 'KFC (388)', job: 'Asphalt Seal Coating', date: '2017-12-04', amountUsd: 20400.0 },
  { invoice: '2319', customer: 'KFC (127)', job: 'parking lot rehab', date: '2017-12-04', amountUsd: 35618.0 },
  { invoice: '2318', customer: 'KFC (126)', job: 'parking lot rehab', date: '2017-12-04', amountUsd: 41723.0 },
  { invoice: '2355', customer: 'jayco construction', job: 'parking lot rehab', date: '2017-12-04', amountUsd: 26500.0 },
  { invoice: '2358', customer: 'KFC 019', job: 'Concrete', date: '2017-12-05', amountUsd: 18630.0 },
  { invoice: '2323', customer: 'KFC (131)', job: 'parking lot rehab', date: '2017-12-08', amountUsd: 47314.0 },
  { invoice: '2361', customer: 'KFC(221)', job: 'parking lot rehab', date: '2017-12-18', amountUsd: 25755.0 },
  { invoice: '2360', customer: 'KFC(222)', job: 'parking lot rehab', date: '2017-12-18', amountUsd: 13345.0 },
  { invoice: '2362', customer: 'KBP Foods', job: 'parking lot rehab', date: '2017-12-29', amountUsd: 14873.0 },
  { invoice: '2363', customer: 'KFC(226)', job: 'parking lot rehab', date: '2017-12-29', amountUsd: 44191.0 },
  { invoice: '2364', customer: 'Wichello LLC', job: 'Asphalt Paving', date: '2018-01-23', amountUsd: 4300.0 },
  { invoice: '2368', customer: 'Beau Anderson', job: 'Asphalt Paving', date: '2018-01-25', amountUsd: 3700.0 },
  { invoice: '2367', customer: 'Wayne Hudgins', job: 'parking lot rehab', date: '2018-01-25', amountUsd: 2500.0 },
  { invoice: '2320', customer: 'KFC (130)', job: 'parking lot rehab', date: '2018-01-29', amountUsd: 12478.0 },
  { invoice: '2371', customer: 'Franco custom building', job: 'Asphalt Paving', date: '2018-02-22', amountUsd: 3500.0 },
  { invoice: '2378', customer: 'Franco custom building', job: 'Asphalt Paving', date: '2018-03-07', amountUsd: 3000.0 },
  { invoice: '2377', customer: 'Wichello LLC', job: 'Asphalt Paving', date: '2018-03-08', amountUsd: 5700.0 },
  { invoice: '2389', customer: 'KFC(207)', job: 'parking lot rehab', date: '2018-05-04', amountUsd: 47843.0 },
  { invoice: '2402', customer: 'Lancaster Custom Builders', job: 'Asphalt Paving', date: '2018-05-04', amountUsd: 11600.0 },
  { invoice: '2395', customer: 'Michael Jennings', job: 'Asphalt Paving', date: '2018-05-24', amountUsd: 2500.0 },
  { invoice: '2394', customer: 'Michael Jennings', job: 'Asphalt Paving', date: '2018-05-24', amountUsd: 9300.0 },
  { invoice: '2406', customer: 'Jerry Holleman', job: 'parking lot rehab', date: '2018-05-25', amountUsd: 6500.0 },
  { invoice: '2450', customer: 'KFC(062)', job: 'parking lot rehab', date: '2018-07-06', amountUsd: 38711.0 },
  { invoice: '2451', customer: 'KFC(246)', job: 'parking lot rehab', date: '2018-07-06', amountUsd: 46641.0 },
  { invoice: '2393', customer: 'KFC(251)', job: 'parking lot rehab', date: '2018-07-23', amountUsd: 57390.0 },
  { invoice: '2452', customer: 'KFC(247)', job: 'parking lot rehab', date: '2018-07-24', amountUsd: 48547.0 },
  { invoice: '2455', customer: 'KFC--Ennis TX', job: 'KFC NEW BUILD', date: '2018-07-24', amountUsd: 51832.0 },
  { invoice: '2464', customer: 'KFC-Crowley', job: 'KFC NEW BUILD', date: '2018-07-30', amountUsd: 3099.99 },
  { invoice: '2391', customer: 'KFC (249)', job: 'Asphalt Paving', date: '2018-08-06', amountUsd: 60460.0 },
  { invoice: '2472', customer: 'KFC-Sulphur Springs', job: 'KFC NEW BUILD', date: '2018-08-13', amountUsd: 113904.14 },
  { invoice: '2471', customer: 'KFC-Jefferson City', job: 'KFC NEW BUILD', date: '2018-08-13', amountUsd: 94546.81 },
  { invoice: '2495', customer: 'KFC-Jennings', job: 'KFC - Change order', date: '2018-08-28', amountUsd: 190968.76 },
  { invoice: '2456', customer: 'Kindercare--- Midlothian', job: 'parking lot rehab', date: '2018-08-29', amountUsd: 8354.0 },
  { invoice: '2499', customer: 'Read Branch', job: 'Asphalt Paving', date: '2018-09-07', amountUsd: 8600.0 },
  { invoice: '2480', customer: 'UCS Construction', job: 'Asphalt Paving', date: '2018-11-27', amountUsd: 25784.65 },
  { invoice: '2639', customer: 'Arbys', job: 'Asphalt Paving', date: '2019-05-19', amountUsd: 54370.0 },
  { invoice: '2667', customer: 'Mr. Beck', job: 'Asphalt Paving', date: '2019-05-24', amountUsd: 7200.0 },
  { invoice: '2680', customer: 'Inspire Brands', job: 'Asphalt Paving', date: '2019-06-10', amountUsd: 2500.0 },
  { invoice: '2693', customer: 'Sandspur construction', job: 'Grading', date: '2019-07-03', amountUsd: 4200.0 },
  { invoice: '2577', customer: 'Lindsey', job: 'Asphalt Paving', date: '2019-10-19', amountUsd: 9743.0 },
  { invoice: '732', customer: 'Cathy', job: 'Asphalt Paving', date: '2020-05-07', amountUsd: 6500.0 },
  { invoice: '2751', customer: 'Mr byrd', job: 'Chip and tar', date: '2020-09-30', amountUsd: 5000.0 },
  { invoice: '2753', customer: 'Max Turner', job: 'Chip and tar', date: '2020-10-15', amountUsd: 6250.0 },
  { invoice: '2757', customer: 'Niyazova_naima@yahoo.com', job: 'Asphalt Paving', date: '2020-11-02', amountUsd: 11000.0 },
  { invoice: '2776', customer: 'DYvonne  Samuel', job: 'Asphalt Paving', date: '2022-04-04', amountUsd: 5200.0 },
]

/** Commercial restaurant lines only — KFC and KBP Foods. */
export function kfcInvoices() {
  return INVOICES.filter((i) => /\bKFC|KBP/i.test(i.customer))
}

/** Aggregate helper. Never sums an advance with its own final — see above. */
export function totalFor(predicate) {
  return INVOICES.filter(predicate).reduce((sum, i) => sum + i.amountUsd, 0)
}
