'use client';

import { Box, Typography } from '@mui/material';
import LandingHeader from '@/app/intro/Header';
import Footer from '@/app/intro/Footer';
import AppProviderWrapper from '@/components/main/AppProviderWrapper';

export default function PrivacyPolicyPage() {
    return (
        <AppProviderWrapper>
            <LandingHeader />
            <Box sx={{ minHeight: '100vh', backgroundColor: '#07282C' }}>
                <Box sx={{
                    maxWidth: 820,
                    mx: 'auto',
                    px: { xs: 3, md: 6 },
                    pt: { xs: 10, md: 14 },
                    pb: { xs: 8, md: 12 },
                }}>
                    <Box sx={{ mb: 8 }}>
                        <Typography sx={{ fontSize: { xs: '1.25rem', md: '1.55rem' }, fontWeight: 700, color: '#fff', lineHeight: 1.4, mb: 2 }}>
                            «Մադբեյզ» ինտերնետային կայքի գաղտնիության քաղաքականություն
                        </Typography>
                        <Box sx={{ width: 48, height: 3, bgcolor: '#00ABBE', borderRadius: 2 }} />
                    </Box>

                <Box sx={{ mb: 5 }}>
                    <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.18em", color: "#00ABBE", textTransform: "uppercase", mb: 2.5 }}>
                        I. ԸՆԴՀԱՆՈՒՐ ԴՐՈՒՅԹՆԵՐ
                    </Typography>
                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                    <Box sx={{ display: "flex", gap: 1.5, mb: 1.2 }}>
                        <Typography component="span" sx={{ fontSize: "0.82rem", color: "rgba(0,171,190,0.7)", fontWeight: 600, minWidth: "28px", pt: "1px" }}>1.1</Typography>
                        <Typography sx={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.78)", lineHeight: 1.75 }}>Սույն Գաղտնիության քաղաքականությունը սահմանում է Մադբեյզ ինտերնետային կայքի(այսուհետ՝ Կայք) միջոցով Օգտագործողի վերաբերյալ տեղեկատվության հավաքագրման և օգտագործման կանոնները:</Typography>
                    </Box>
                    <Box sx={{ display: "flex", gap: 1.5, mb: 1.2 }}>
                        <Typography component="span" sx={{ fontSize: "0.82rem", color: "rgba(0,171,190,0.7)", fontWeight: 600, minWidth: "28px", pt: "1px" }}>1.2</Typography>
                        <Typography sx={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.78)", lineHeight: 1.75 }}>Սույն Գաղտնիության քաղաքականությունը չի տարածվում այլ ինքնուրույն ինտերնետային հարթակների (կայքերի) վրա:</Typography>
                    </Box>
                    <Box sx={{ display: "flex", gap: 1.5, mb: 1.2 }}>
                        <Typography component="span" sx={{ fontSize: "0.82rem", color: "rgba(0,171,190,0.7)", fontWeight: 600, minWidth: "28px", pt: "1px" }}>1.3</Typography>
                        <Typography sx={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.78)", lineHeight: 1.75 }}>Սույն Գաղտնիության քաղաքականության իմաստով Օգտագործողի վերաբերյալ տեղեկատվություն են համարվում.</Typography>
                    </Box>
                        <Box sx={{ display: "flex", gap: 1.5, mb: 0.8 }}>
                            <Typography component="span" sx={{ fontSize: "0.82rem", color: "rgba(0,171,190,0.4)", fontWeight: 600, minWidth: "42px", pt: "1px" }}>1.3.1</Typography>
                            <Typography sx={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.62)", lineHeight: 1.75 }}>Օգտագործողի կողմից տրամադրվող անձնական տեղեկատվությունը,</Typography>
                        </Box>
                        <Box sx={{ display: "flex", gap: 1.5, mb: 0.8 }}>
                            <Typography component="span" sx={{ fontSize: "0.82rem", color: "rgba(0,171,190,0.4)", fontWeight: 600, minWidth: "42px", pt: "1px" }}>1.3.2</Typography>
                            <Typography sx={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.62)", lineHeight: 1.75 }}>Ավտոմատ կերպով հավաքագրվող տեղեկատվությունը,</Typography>
                        </Box>
                        <Box sx={{ display: "flex", gap: 1.5, mb: 0.8 }}>
                            <Typography component="span" sx={{ fontSize: "0.82rem", color: "rgba(0,171,190,0.4)", fontWeight: 600, minWidth: "42px", pt: "1px" }}>1.3.3</Typography>
                            <Typography sx={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.62)", lineHeight: 1.75 }}>Օգտագործողի կողմից կազմակերպության վերաբերյալ տրամադրվող տեղեկատվությունը:</Typography>
                        </Box>
                    <Box sx={{ display: "flex", gap: 1.5, mb: 1.2 }}>
                        <Typography component="span" sx={{ fontSize: "0.82rem", color: "rgba(0,171,190,0.7)", fontWeight: 600, minWidth: "28px", pt: "1px" }}>1.4</Typography>
                        <Typography sx={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.78)", lineHeight: 1.75 }}>Օգտագործողի վերաբերյալ տեղեկատվությունը Կայքի կողմից հավաքագրվում, պահպանվում և օգտագործվում է բացառապես Կայքի տեխնիկական կառավարման, դրա աշխատանքի վերլուծության և կատարելագործման և/կամ սույն Գաղտնիության քաղաքականության մեջ նշված այլ նպատակներով:</Typography>
                    </Box>
                    </Box>
                </Box>

                <Box sx={{ mb: 5 }}>
                    <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.18em", color: "#00ABBE", textTransform: "uppercase", mb: 2.5 }}>
                        II. ՕԳՏԱԳՈՐԾՈՂԻ ԿՈՂՄԻՑ ՏՐԱՄԱԴՐՎՈՂ ԱՆՁՆԱԿԱՆ ՏԵՂԵԿԱՏՎՈՒԹՅՈՒՆ
                    </Typography>
                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                    <Box sx={{ display: "flex", gap: 1.5, mb: 1.2 }}>
                        <Typography component="span" sx={{ fontSize: "0.82rem", color: "rgba(0,171,190,0.7)", fontWeight: 600, minWidth: "28px", pt: "1px" }}>2.1</Typography>
                        <Typography sx={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.78)", lineHeight: 1.75 }}>Կայքին Օգտագործողի վերաբերյալ անձնական տեղեկատվությունը հասանելի է դառնում այն պահին, երբ Օգտագործողը լրացնում է իր անձնական տվյալները Կայքում հետադարձ կապի համար դիմելիս, իսկ Կայքի որևէ բաժնի համար բաժանորդագրություն նախատեսված լինելու դեպքում` նաև բաժանորդագրման հայտ ներկայացնելիս:</Typography>
                    </Box>
                    <Box sx={{ display: "flex", gap: 1.5, mb: 1.2 }}>
                        <Typography component="span" sx={{ fontSize: "0.82rem", color: "rgba(0,171,190,0.7)", fontWeight: 600, minWidth: "28px", pt: "1px" }}>2.2</Typography>
                        <Typography sx={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.78)", lineHeight: 1.75 }}>Կայքի կողմից կարող են հավաքագրվել և պահպանվել Օգտագործողի կողմից Կայքում լրացված այնպիսի անձնական տվյալներ, ինչպիսիք են անուն, ազգանուն, էլեկտրոնային փոստի հասցե, հեռախոսահամար: Սույն կետում նշված տվյալները Կայքի կողմից կարող են օգտագործվել բացառապես Օգտագործողին տարատեսակ գովազդային նյութեր և նորություններ ուղարկելու, Կայքի մատուցվող ծառայությունները Օգտագործողին ներկայացնելու, ինչպես նաև կազմակերպության վերաբերյալ հանրային ներկայացուցչություն ապահովելու համար:</Typography>
                    </Box>
                    </Box>
                </Box>

                <Box sx={{ mb: 5 }}>
                    <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.18em", color: "#00ABBE", textTransform: "uppercase", mb: 2.5 }}>
                        III. ԻՆՔՆԱՇԽԱՏ ԿԵՐՊՈՎ ՀԱՎԱՔՎՈՂ ՏԵՂԵԿԱՏՎՈՒԹՅՈՒՆ
                    </Typography>
                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                    <Box sx={{ display: "flex", gap: 1.5, mb: 1.2 }}>
                        <Typography component="span" sx={{ fontSize: "0.82rem", color: "rgba(0,171,190,0.7)", fontWeight: 600, minWidth: "28px", pt: "1px" }}>3.1</Typography>
                        <Typography sx={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.78)", lineHeight: 1.75 }}>Կայքի աշխատանքի կատարելագործման, Կայքի օգտագործման վերաբերյալ ընդհանուր վիճակագրական տեղեկատվության հավաքագրման նպատակով ինքնաշխատ եղանակով կարող է հավաքագրվել և պահպանվել Օգտագործողի վերաբերյալ որոշակի տեղեկատվություն ` ներառյալ, սակայն չսահմանափակվելով.</Typography>
                    </Box>
                        <Box sx={{ display: "flex", gap: 1.5, mb: 0.8 }}>
                            <Typography component="span" sx={{ fontSize: "0.82rem", color: "rgba(0,171,190,0.4)", fontWeight: 600, minWidth: "42px", pt: "1px" }}>3.1.1</Typography>
                            <Typography sx={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.62)", lineHeight: 1.75 }}>Օգտագործողների կողմից օգտագործվող սարքի վերաբերյալ տեղեկատվություն (օրինակ` սարքի տեսակը/մոդելը, զննարկիչների տեսակը` այդ թվում դրա հերթական տարբերակը (Google Chrome, Safari, այլ), օպերացիոն համակարգը` այդ թվում դրա հերթական տարբերակը (iOS, Android, այլ), IP հասցեն);</Typography>
                        </Box>
                        <Box sx={{ display: "flex", gap: 1.5, mb: 0.8 }}>
                            <Typography component="span" sx={{ fontSize: "0.82rem", color: "rgba(0,171,190,0.4)", fontWeight: 600, minWidth: "42px", pt: "1px" }}>3.1.2</Typography>
                            <Typography sx={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.62)", lineHeight: 1.75 }}>ժամանակահատվածը, որը Օգտագործողները անցկացնում են Կայքում;</Typography>
                        </Box>
                        <Box sx={{ display: "flex", gap: 1.5, mb: 0.8 }}>
                            <Typography component="span" sx={{ fontSize: "0.82rem", color: "rgba(0,171,190,0.4)", fontWeight: 600, minWidth: "42px", pt: "1px" }}>3.1.3</Typography>
                            <Typography sx={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.62)", lineHeight: 1.75 }}>Աշխարհագրական տեղեկատվություն (Կայքի հաճախումները` ըստ երկրների);</Typography>
                        </Box>
                        <Box sx={{ display: "flex", gap: 1.5, mb: 0.8 }}>
                            <Typography component="span" sx={{ fontSize: "0.82rem", color: "rgba(0,171,190,0.4)", fontWeight: 600, minWidth: "42px", pt: "1px" }}>3.1.4</Typography>
                            <Typography sx={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.62)", lineHeight: 1.75 }}>Կայքի հաճախումները տարբեր էլեկտրոնային միջավայրերից (այլ կայքերից, հավելվածներից և այլն);</Typography>
                        </Box>
                        <Box sx={{ display: "flex", gap: 1.5, mb: 0.8 }}>
                            <Typography component="span" sx={{ fontSize: "0.82rem", color: "rgba(0,171,190,0.4)", fontWeight: 600, minWidth: "42px", pt: "1px" }}>3.1.5</Typography>
                            <Typography sx={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.62)", lineHeight: 1.75 }}>Օգտագործողի կողմից Կայքում կատարվող գործողությունները` հետագա այցելությունների նպատակով Օգտագործողների նախընտրությունները հասկանալու և հիշելու համար;</Typography>
                        </Box>
                        <Box sx={{ display: "flex", gap: 1.5, mb: 0.8 }}>
                            <Typography component="span" sx={{ fontSize: "0.82rem", color: "rgba(0,171,190,0.4)", fontWeight: 600, minWidth: "42px", pt: "1px" }}>3.1.6</Typography>
                            <Typography sx={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.62)", lineHeight: 1.75 }}>Կայքի հաճախումների մասին տեղեկատվություն:</Typography>
                        </Box>
                    <Box sx={{ display: "flex", gap: 1.5, mb: 1.2 }}>
                        <Typography component="span" sx={{ fontSize: "0.82rem", color: "rgba(0,171,190,0.7)", fontWeight: 600, minWidth: "28px", pt: "1px" }}>3.2</Typography>
                        <Typography sx={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.78)", lineHeight: 1.75 }}>Նշված տեղեկատվությունը Կայքը ստանում է բոլոր Օգտագործողների վերաբերյալ` համախմբված տեսքով: Այս տեղեկատվությունը քանակական է, չի պարունակում կոնկրետ Օգտագործողի վերաբերյալ որևէ անձնական տեղեկատվություն և որևէ դեպքում չի կարող բավարար լինել կամ հնարավորություն ընձեռել նույնականացնել Օգտագործողին:</Typography>
                    </Box>
                    <Box sx={{ display: "flex", gap: 1.5, mb: 1.2 }}>
                        <Typography component="span" sx={{ fontSize: "0.82rem", color: "rgba(0,171,190,0.7)", fontWeight: 600, minWidth: "28px", pt: "1px" }}>3.3</Typography>
                        <Typography sx={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.78)", lineHeight: 1.75 }}>Կայքից ինքնաշխատ եղանակով տեղեկատվության հավաքագրման համար կարող են օգտագործվել մի շարք վերլուծական գործիքներ:</Typography>
                    </Box>
                    </Box>
                </Box>

                <Box sx={{ mb: 5 }}>
                    <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.18em", color: "#00ABBE", textTransform: "uppercase", mb: 2.5 }}>
                        IV. ԱՆՎՏԱՆԳՈՒԹՅԱՆ ԱՊԱՀՈՎՈՒՄ
                    </Typography>
                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                    <Box sx={{ display: "flex", gap: 1.5, mb: 1.2 }}>
                        <Typography component="span" sx={{ fontSize: "0.82rem", color: "rgba(0,171,190,0.7)", fontWeight: 600, minWidth: "28px", pt: "1px" }}>4.1</Typography>
                        <Typography sx={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.78)", lineHeight: 1.75 }}>Կայքի միջոցով Օգտագործողի վերաբերյալ ստացված տեղեկատվության գաղտնիության ապահովումը Կայքը պաշտպանում է Օգտագործողի կողմից տրամադրած, ինչպես նաև Օգտագործողի վերաբերյալ ավտոմատ ստացվող տեղեկատվությունը մի քանի եղանակով, մասնավորապես, կիրառում է գաղտնագրման գործող թվային գործիքները:</Typography>
                    </Box>
                    </Box>
                </Box>

                <Box sx={{ mb: 5 }}>
                    <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.18em", color: "#00ABBE", textTransform: "uppercase", mb: 2.5 }}>
                        V. ՏԵՂԵԿՈՒԹՅՈՒՆՆԵՐԻ ՏՐԱՄԱԴՐՈՒՄԸ ԵՐՐՈՐԴ ԱՆՁԱՆՑ
                    </Typography>
                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                    <Box sx={{ display: "flex", gap: 1.5, mb: 1.2 }}>
                        <Typography component="span" sx={{ fontSize: "0.82rem", color: "rgba(0,171,190,0.7)", fontWeight: 600, minWidth: "28px", pt: "1px" }}>5.1</Typography>
                        <Typography sx={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.78)", lineHeight: 1.75 }}>Կայքը երաշխավորում է Օգտագործողի վերաբերյալ Կայքի միջոցով իրեն հայտնի դարձած անձնական տվյալների պահպանումը և չտրամադրումը երրորդ անձանց` բացառությամբ ՀՀ օրենսդրությամբ սահմանված դեպքերի և Օգտագործողի կողմից ներկայացված պահանջի և/կամ տրված համաձայնության:</Typography>
                    </Box>
                    <Box sx={{ display: "flex", gap: 1.5, mb: 1.2 }}>
                        <Typography component="span" sx={{ fontSize: "0.82rem", color: "rgba(0,171,190,0.7)", fontWeight: 600, minWidth: "28px", pt: "1px" }}>5.2</Typography>
                        <Typography sx={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.78)", lineHeight: 1.75 }}>Մարքեթինգի, գովազդի կամ Կայքի աշխատանքի բարելավմանն ուղղված այլ նպատակներով Կայքի հետ համագործակցող և Կայքի բնականոն աշխատանքը սպասարկող երրորդ անձանց կարող է տրամադրվել Օգտագործողների վերաբերյալ ոչ անձնական, քանակական տեղեկատվություն, որը որևէ դեպքում չի կարող բավարար լինել կամ հնարավորություն ընձեռել նույնականացնել Օգտագործողներին:</Typography>
                    </Box>
                    <Box sx={{ display: "flex", gap: 1.5, mb: 1.2 }}>
                        <Typography component="span" sx={{ fontSize: "0.82rem", color: "rgba(0,171,190,0.7)", fontWeight: 600, minWidth: "28px", pt: "1px" }}>5.3</Typography>
                        <Typography sx={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.78)", lineHeight: 1.75 }}>Օգտագործողների վերաբերյալ երրորդ անձանց կարող է տրամադրվել նաև Կայքում տեղադրված գովազդի միջոցով այլ հարթակներ անցնելու քանակի վերաբերյալ և ընդհանուր վիճակագրական ոչ անձնական, քանակական տեղեկատվություն, որը որևէ դեպքում չի կարող բավարար լինել կամ հնարավորություն ընձեռել նույնականացնել Օգտագործողներին:</Typography>
                    </Box>
                    </Box>
                </Box>

                <Box sx={{ mb: 5 }}>
                    <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.18em", color: "#00ABBE", textTransform: "uppercase", mb: 2.5 }}>
                        VI. ԱՅԼ ՊԱՅՄԱՆՆԵՐ
                    </Typography>
                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                    <Box sx={{ display: "flex", gap: 1.5, mb: 1.2 }}>
                        <Typography component="span" sx={{ fontSize: "0.82rem", color: "rgba(0,171,190,0.7)", fontWeight: 600, minWidth: "28px", pt: "1px" }}>6.1</Typography>
                        <Typography sx={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.78)", lineHeight: 1.75 }}>Օգտվելով Կայքից` Օգտագործողն ընդունում է սույն Գաղտնիության քաղաքականությամբ սահմանված պայմանները և տալիս իր համաձայնությունը` սույն Գաղտնիության քաղաքականությամբ սահմանված նպատակներով Օգտագործողի վերաբերյալ տեղեկատվությունը հավաքագրելու և օգտագործելու համար:</Typography>
                    </Box>
                    <Box sx={{ display: "flex", gap: 1.5, mb: 1.2 }}>
                        <Typography component="span" sx={{ fontSize: "0.82rem", color: "rgba(0,171,190,0.7)", fontWeight: 600, minWidth: "28px", pt: "1px" }}>6.2</Typography>
                        <Typography sx={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.78)", lineHeight: 1.75 }}>ՀՀ օրենսդրությամբ նախատեսած իրավական հիմքերի առկայության դեպքում Օգտագործողի` Կայքին տրամադրված անձնական տվյալների ուղղման, ոչնչացման և/կամ մշակման դադարեցման վերաբերյալ Օգտագործողի գրավոր դիմումը դիտարկվում և ընթացք է տրվում ՀՀ օրենսդրությամբ սահմանված կարգով և ժամկետներում:</Typography>
                    </Box>
                    <Box sx={{ display: "flex", gap: 1.5, mb: 1.2 }}>
                        <Typography component="span" sx={{ fontSize: "0.82rem", color: "rgba(0,171,190,0.7)", fontWeight: 600, minWidth: "28px", pt: "1px" }}>6.3</Typography>
                        <Typography sx={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.78)", lineHeight: 1.75 }}>Սույն Գաղտնիության քաղաքականության փոփոխությունները Կայքը հասանելի է դարձնում Օգտագործողին Կայքում` դրանց ուժի մեջ մտնելուց ոչ ուշ, քան 7 (յոթ) աշխատանքային օր առաջ:</Typography>
                    </Box>
                    </Box>
                </Box>

                </Box>
            </Box>
            <Footer />
        </AppProviderWrapper>
    );
}
