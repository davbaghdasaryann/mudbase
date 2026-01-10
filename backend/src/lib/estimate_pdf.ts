import { style, getStyles, cssRule, createTypeStyle } from 'typestyle';
import beautify from "js-beautify";


import { TFunction } from 'i18next';

import { formatCurrency } from '@/lib/format_currency';
import { fixedToThree, roundToThree } from '@/tslib/parse';


export function generateEstimateHTML(data: any, t: TFunction) {

    const estimate = data.estimate;
    // Common styles
    const headerTableCol1Width = '200px';


    const ts = createTypeStyle();

    ts.cssRule('body', {
        fontFamily: 'Noto Sans Armenian, Arial, sans-serif',
        fontOpticalSizing: 'auto',
        margin: 0,
        padding: 0,
        fontSize: 12,
    });

    ts.cssRule('h1, h3', {
        textAlign: 'center',
    });

    ts.cssRule('.container', {
        //   display: flex;
        //   flex-direction: column;
        //   align-items: center
        paddingTop: 10,
        paddingLeft: 10,
        paddingRight: 10,
    });

    ts.cssRule('.stackContainer', {
        display: 'flex',
    });

    ts.cssRule('.columnHalf', {
        flex: 1,
        boxSizing: 'border-box',
    });

    ts.cssRule('.header', {
        width: '100%',
        // display: block;
        // justify-content: space-between;
        // align-items: left;

        /* margin-top: 30px; */
    });

    ts.cssRule('.logo', {
        width: 100,
        height: 'auto',
    });

//   .lightBlue{
//     background-color: lightblue;
//   }
//   .lightGreen{
//     background-color: lightgreen;
//   }

    ts.cssRule('.lightBlue', {
        backgroundColor: '#b4ccd6',
    });

    ts.cssRule('.lightGreen', {
        backgroundColor: '#e2efd9',
    });

    ts.cssRule('.lightGray', {
        backgroundColor: 'lightgray',
    });


    ts.cssRule('.headerTable', {
        borderCollapse: 'collapse',
        width: '100%',
        // marginTop: 15,
        // textAlign: 'left',
    })

    ts.cssRule('.headerTableName', {
        border: '1px solid black',
        fontStyle: 'italic',
        width: headerTableCol1Width,
        paddingLeft: 4,
        paddingRight: 4,
    });

    ts.cssRule('.headerTableValue', {
        paddingLeft: 4,
        paddingRight: 4,
    });

    // ts.cssRule('.headerTableCurrency', {
    //     textAlign: 'center',
    //     fontWeight: 'bolder',
    // });

    ts.cssRule('.center', {
        textAlign: 'center',
    });

    ts.cssRule('.bold', {
        fontWeight: 'bolder',
    });


    ts.cssRule('.estimateTable', {
        borderCollapse: 'collapse',
        width: '100%',
        // border: '1px solid black',
    });

    ts.cssRule('.estimateTable td, .estimateTable th', {
        border: '1px solid black',
        textAlign: 'center',
        paddingLeft: 4,
        paddingRight: 4,
    });

    ts.cssRule('.section', {
        fontWeight: 'bold',
        textTransform: 'capitalize',
        textAlign: 'center',
        paddingTop: 8,
        paddingBottom: 8,
    });


    ts.cssRule('.subsection', {
        fontWeight: 'bold',
        textTransform: 'capitalize',
        textAlign: 'center',
        paddingTop: 8,
        paddingBottom: 8,
    });

    ts.cssRule('.importantInfo', {
        fontWeight: 'bold',
        textAlign: 'left',
    });






    // ts.cssRule('table', {
    //     width: '100%;',
    //     borderCollapse: 'collapse',
    //     marginTop: 15,
    // });

    // ts.cssRule('th, td', {
    //     border: `1px solid #ddd`,
    //     padding: 5,
    //     textAlign: 'center',
    // });

    // ts.cssRule('th', {
    //     backgroundColor: '#f2f2f2',
    // });



    // log_.info(data);

    // body {
    //     font-family: Arial, sans-serif;
    //     margin: 0;
    //     padding: 0;
    //     font-size: 12px;
    // }

//   .table-header {
//     background-color: #d9d9d9;
//   }
  
//   .headerParagraph{
//     font-weight:bold;

//   }


    const styles = beautify.css(ts.getStyles());

    const vertSpacer = `<div>&nbsp;</div>\n`;

        // ${ts.getStyles()}


    let html = `
<!DOCTYPE html>
<html>
<head>
<title>Estimate Report</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Armenian:wght@100..900&display=swap" rel="stylesheet">

<style>
${styles}
</style>
`;

html += `
<body>
<div class="container">
`;


// Estimate report main header table
html += `
<div class="stackContainer">
<div style="flex: 1; box-sizing: border-box">
    <table class="headerTable">
        <tr>
            <td class="headerTableName lightGreen">Նախահաշվի անվանումը</td>
            <td class="headerTableValue bold">${ensureNotUndefined(estimate.name)}</td>
        </tr>

        <tr>
            <td class="headerTableName lightGreen">Հասցե</td>
            <td class="headerTableValue">${ensureNotUndefined(estimate.address)}</td>
        </tr>

        <tr>
            <td class="headerTableName lightGreen">Գեներացման ամսաթիվ</td>
            <td class="headerTableValue bold">${formatEstimateDate(new Date())}</td>
        </tr>
    </table>
</div>

<div style="box-sizing: border-box">
<img src="/images/logo_wide.png" alt="Logo" style="height: 38px; width: auto; margin-right: 20px; margin-top: 5px;"/>

</div>
</div>
`;

html += vertSpacer;


// Estimate report subheader tables
// first column
html += `
<div class="stackContainer">
<div class="columnHalf">
<table class="headerTable">
    <tr>
        <td class="headerTableName lightGray">Կազմակերպության անվանումը</td>
        <td class="headerTableValue">${ensureNotUndefined(data.accountName)}</td>
    </tr>

    <tr>
        <td class="headerTableName lightGray">Շինարարության տեսակը</td>
        <td class="headerTableValue">${ensureNotUndefined(t(estimate.constructionType))}</td>
    </tr>

    <tr>
        <td class="headerTableName lightGray">Կառուցապատման մակերեսը</td>
        <td class="headerTableValue">${ensureNotUndefined(estimate.constructionSurface)}</td>
    </tr>
</table>
</div>

<div class="columnHalf">
<table class="headerTable">
    <tr>
        <td class="headerTableName lightGray">Ընդհանուր արժեքը</td>
        <td class="headerTableValue center bold">${formatEstimateCurrencySymbol(estimate.totalCostWithOtherExpenses)}</td>
    </tr>

    <tr>
        <td class="headerTableName lightGray">Ուղղակի ծախսեր</td>
        <td class="headerTableValue center bold">${formatEstimateCurrencySymbol(estimate.totalCost)}</td>
    </tr>

    <tr>
        <td class="headerTableName lightGray">Այլ ծախսեր</td>
        <td class="headerTableValue center bold">${formatEstimateCurrencySymbol(estimate.totalCostWithOtherExpenses - estimate.totalCost)}</td>
    </tr>
</table>
</div>
</div>
`;

    html += vertSpacer;


    // <div class="header">
    //     <h1>${ensureNotUndefined(data.estimate.name)}</h1>
    //     <!--<img src="logo.png" alt="Logo" class="logo" />-->
    // </div>

    //   <p>Գեներացման ամսաթիվ: <span class='headerParagraph'>${formatEstimateDate(new Date())} </span> </p>
    //   <p>Կազմակերպության անվանումը:  <span class='headerParagraph'> ${ensureNotUndefined(data.accountName)}  </span> </p>
    //   <p>Շինարարության տեսակը:  <span class='headerParagraph'> ${ensureNotUndefined(t(estimate.constructionType))} </span> </p>
    //   <p>Կառուցապատման մակերեսը: <span class='headerParagraph'>${ensureNotUndefined(estimate.constructionSurface)} </span> </p>
    //   <p>Նախահաշվային արժեք:  <span class='headerParagraph'> ${ensureNotUndefined(formatEstimateCurrency(estimate.totalCost))} AMD</span> </p>
    //   <p>Այլ Ծախսեր:  <span class='headerParagraph'> ${ensureNotUndefined(formatEstimateCurrency(estimate.totalCostWithOtherExpenses - estimate.totalCost))} AMD</span> </p>

    const smallw = "24px";
    const codew = "50px";
    const qtyw = "60px"; // quantity
    const costw = "60px"; // cost
    const unithw = "60px"; // unit/hour
    const namew = "100px";

html += `
      <table class="estimateTable">
        <colgroup>
            <col style="min-width: ${smallw}; max-width: ${smallw}"> <!-- index -->
            <col style="min-width: ${codew}; max-width: ${codew}"> <!-- code -->
            <col style="min-width: ${namew};"> <!-- name -->
            <col style="min-width: ${smallw}; max-width: ${smallw}"> <!-- MU -->
            <col style="min-width: ${qtyw}; max-width: ${qtyw}"> <!-- Quantity -->
            <col style="min-width: ${costw}; max-width: ${costw}"> <!-- Cost -->
            <col style="min-width: ${unithw}; max-width: ${unithw}"> <!-- Unit/hours -->

            <col style="min-width: ${codew}; max-width: ${codew}"> <!-- code -->
            <col style="min-width: ${namew};"> <!-- name -->
            <col style="min-width: ${smallw}; max-width: ${smallw}"> <!-- MU -->
            <col style="min-width: ${qtyw}; max-width: ${qtyw}"> <!-- Quantity -->
            <col style="min-width: ${qtyw}; max-width: ${qtyw}"> <!-- Quantity -->
            <col style="min-width: ${costw}; max-width: ${costw}"> <!-- Cost -->
            <col style="min-width: ${costw}; max-width: ${costw}"> <!-- Cost -->


            <col style="min-width: ${costw}; max-width: ${costw}"> <!-- Cost -->
            <col style="min-width: ${costw}; max-width: ${costw}"> <!-- Cost -->

        </colgroup>

        <thead>
          <tr class="table-header">
            <th class="lightBlue" rowspan="2">Հ/հ</th>
            <th class="lightBlue" rowspan="2">Կոդը</th>
            <th class="lightBlue" rowspan="2">Աշխատանքի անվանումը</th>
            <th class="lightBlue" rowspan="2">Չ․Մ․</th>
            <th class="lightBlue" rowspan="2">Քանակը</th>
            <th class="lightBlue" rowspan="2">Արժեքը</th>
            <th class="lightBlue" rowspan="2">Միավոր/ ժամ</th>
            <th class="lightGreen" colspan="7">Հաշվարկային նյութածախս</th>
            <th class="lightGray" rowspan="2">Աշխատ․ միավոր արժեքը</th>
            <th class="lightGray" rowspan="2">Ընդհանուր միավոր արժեքը</th>
          </tr>

          <tr>
            <th class="lightGreen">Կոդ</th>
            <th class="lightGreen">Նյութի անվանումը</th>
            <th class="lightGreen">Չ․Մ․</th>
            <th class="lightGreen">Նորմա ծախս</th>
            <th class="lightGreen">Քանակ</th>
            <th class="lightGreen">Նյութի արժեքը</th>
            <th class="lightGreen">Նյութի ընդհանուր արժեքը</th>
          </tr>
        </thead>

        <tbody>
  `;

    let sectionIndex = 0;
    let laborTotalIndex = 0;

    for (const sectionData of data.sections) {
        ++sectionIndex;
        html += `
            <tr>
                <td class="section" colspan="14">${sectionIndex}. ${ensureNotUndefined(sectionData.section.name || sectionData.section._id)}</td>
                <td class="section" colspan="2"> ${formatEstimateCurrency(sectionData.section.totalCost)}</td>
            </tr>`;

        let subSectIndex = 0;
        for (const subsectionData of sectionData.subsections) {
            ++subSectIndex;
            if (subsectionData.subsection.name) {
                html += `
                <tr>
                    <td class="lightBlue subsection" colspan="14"> ${sectionIndex}.${subSectIndex} ${ensureNotUndefined(subsectionData.subsection.name)}</td>
                    <td class="lightBlue subsection" colspan="2"> ${formatEstimateCurrency(subsectionData.subsection.totalCost)}</td>
                </tr>`;
            }

            let laborIndex = 0;

            //     for (const laborData of subsectionData.labors) {

            //         ++laborIndex;
            //         html += `
            //   <tr >
            //     <td rowspan='${laborData.materials.length ? laborData.materials.length : 1}'> ${laborIndex}</td>
            //     <td rowspan='${laborData.materials.length ? laborData.materials.length : 1}'> ${laborData.labor.laborItemId}</td>
            //     <td rowspan='${laborData.materials.length ? laborData.materials.length : 1}'> ${laborData.labor.laborOfferItemName}</td>
            //     <td rowspan='${laborData.materials.length ? laborData.materials.length : 1}'> ${laborData.labor.measurementUnitMongoId}</td>
            //     <td rowspan='${laborData.materials.length ? laborData.materials.length : 1}'> ${fmt(laborData.labor.quantity)}</td>
            //     <td rowspan='${laborData.materials.length ? laborData.materials.length : 1}'> ${fmt(laborData.labor.changableAveragePrice)}</td>
            //     <td rowspan='${laborData.materials.length ? laborData.materials.length : 1}'> ${laborData.labor.laborHours}</td>
            //     `;

            //         if (laborData.materials && laborData.materials.length > 0) {

            //             if (laborData.materials && laborData.materials.length > 0) {
            //                 const materialsTotal = laborData.materials
            //                     .reduce((sum: any, m: any) => sum + (m.changableAveragePrice * m.quantity), 0);
            //                 const totalLaborCost = laborData.labor.changableAveragePrice * laborData.labor.quantity;
            //                 const totalCost = totalLaborCost + materialsTotal;
            //                 const unitCost = laborData.labor.quantity
            //                     ? totalCost / laborData.labor.quantity
            //                     : 0;
            //                 const rowspan = laborData.materials.length;

            //                 let materialId = 0;
            //                 for (const material of laborData.materials) {
            //                     ++materialId;

            //                     html += `
            //                     ${materialId !== 1 ? '<tr>' : ''}
            //                     <td>${ensureNotUndefined(material.materialItemId)}</td>
            //                     <td>${ensureNotUndefined(material.materialOfferItemName)}</td>
            //                     <td>${ensureNotUndefined(material.measurementUnitMongoId)}</td>
            //                     <td>${fmt(material.materialConsumptionNorm ?? 0)}</td>
            //                     <td>${fmt(material.quantity)}</td>
            //                     <td>${fmt(material.changableAveragePrice)}</td>
            //                     <td>${fmt(material.changableAveragePrice * material.quantity)}</td>
            //                     ${materialId === 1
            //                             ? `<td rowspan="${rowspan}">${fmt(unitCost)}</td>
            //                             <td rowspan="${rowspan}">${fmt(totalCost)}</td>`
            //                             : ''
            //                         }
            //                     </tr>
            //                     `;
            //                 }

            //                 ++laborTotalIndex;
            //             }

            //         } else {
            //             html += `
            //   <td> </td>
            //   <td> </td>
            //   <td> </td>
            //   <td> </td>
            //   <td> </td>
            //   <td> </td>
            //   <td> </td>
            //   <td> </td>
            //   <td> </td>
            //   `;
            //         }
            //     }

            for (const laborData of subsectionData.labors) {
                ++laborIndex;

                // 1) Compute all totals up‐front, even if there are no materials:
                const materialsTotal = (laborData.materials || []).reduce(
                    (sum: any, m: any) => sum + (m.changableAveragePrice * m.quantity),
                    0
                );
                const totalLaborCost = laborData.labor.changableAveragePrice * laborData.labor.quantity;
                const totalCost = totalLaborCost + materialsTotal;
                const unitCost =
                    laborData.labor.quantity > 0 ? totalCost / laborData.labor.quantity : 0;
                // If materials.length is zero, we'll treat rowspan as 1
                const rowspan = laborData.materials.length || 1;

                // 2) Start the <tr> for the labor fields:
                html += `
                        <tr>
                        <td rowspan="${rowspan}">${laborIndex}</td>
                        <td rowspan="${rowspan}">${laborData.labor.laborItemId}</td>
                        <td rowspan="${rowspan}" style="text-align:left;">${laborData.labor.laborOfferItemName}</td>
                        <td rowspan="${rowspan}">${laborData.labor.measurementUnitMongoId}</td>
                        <td rowspan="${rowspan}">${fmt(laborData.labor.quantity)}</td>
                        <td rowspan="${rowspan}">${formatEstimateCurrency(laborData.labor.changableAveragePrice)}</td>
                        <td rowspan="${rowspan}">${laborData.labor.laborHours}</td>
                        `;

                // 3a) If there *are* materials:
                if (laborData.materials && laborData.materials.length > 0) {
                    let materialId = 0;
                    for (const material of laborData.materials) {
                        ++materialId;

                        // For all but the first material, open a new <tr>
                        html += materialId !== 1 ? '<tr>' : '';

                        html += `
                        <td>${ensureNotUndefined(material.materialItemId)}</td>
                        <td style="text-align:left;">${ensureNotUndefined(material.materialOfferItemName)}</td>
                        <td>${ensureNotUndefined(material.measurementUnitMongoId)}</td>
                        <td>${fmt(material.materialConsumptionNorm ?? 0)}</td>
                        <td>${fmt(material.quantity)}</td>
                        <td>${formatEstimateCurrency(material.changableAveragePrice)}</td>
                        <td>${formatEstimateCurrency(material.changableAveragePrice * material.quantity)}</td>
                        ${
                            // On the first material row, emit the two cost‐cells with rowspan
                            materialId === 1
                                ? `<td rowspan="${rowspan}">${formatEstimateCurrency(unitCost)}</td>
                                <td rowspan="${rowspan}">${formatEstimateCurrency(totalCost)}</td>`
                                : ''
                            }
                        </tr>
                                `;
                    }
                }
                // 3b) If there are *no* materials, emit 7 empty <td> + cost <td>s, then close this single row:
                else {
                    html += `
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td>${formatEstimateCurrency(unitCost)}</td>
                        <td>${formatEstimateCurrency(totalCost)}</td>
                        </tr>
                            `;
                }

                ++laborTotalIndex;
            }

        }
    }

    // adding gap
    html += `
    <tr><td style="border:none;">&nbsp;</td></tr>

    `;

    html += `
        <tr class="lightBlue">
            <td class="subsection" colspan="14">ԱՅԼ ԾԱԽՍԵՐ</td>
            <td class="subsection" colspan="2">${formatEstimateCurrency(data.estimate.totalCostWithOtherExpenses - data.estimate.totalCost)}</td>
        </tr>
    `;

    for (const expence of data.expences) {
        if (expence.name === 'typeOfCost')
            continue

        html += `
            <tr>
            <td class="importantInfo" colspan="14">${t(expence.name)}</td>
            <td class='bold'>${expence.value}%</td>
            <td class="bold">${formatEstimateCurrency((estimate.totalCost * expence.value) / 100)}</td>
            </tr>
        `;
    }

    html += `
        </tbody>
      </table>
      `;

      html += `
      </div>
    </body>
    </html>
  `;

    return html;
}








function formatEstimateDate(date: Date) {
    return date.toLocaleDateString('hy-AM')
}



function fmt(x?: number): string {
    if (x == null) return '';
    const rounded = roundToThree(x);
    const raw = Number.isInteger(rounded)
        ? formatCurrency(rounded)
        : formatCurrency(fixedToThree(rounded));
    return raw ?? '';
}

function ensureNotUndefined<T>(value: T | undefined | null): string {
    return value == null ? '' : String(value);
}

function formatEstimateCurrency(value: number | null | undefined) {
    if (value === null || value === undefined) return 0;
    const intPart = Math.round(value);
    return intPart.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function formatEstimateCurrencySymbol(value: number) {
    return formatEstimateCurrency(value) + ' AMD';
}
