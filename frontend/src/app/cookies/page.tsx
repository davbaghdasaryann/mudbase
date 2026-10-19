'use client';

import { Box, Typography } from '@mui/material';
import LandingHeader from '@/app/intro/Header';
import Footer from '@/app/intro/Footer';
import AppProviderWrapper from '@/components/main/AppProviderWrapper';

export default function CookiePolicyPage() {
    return (
        <AppProviderWrapper>
            <LandingHeader />
            <Box sx={{ minHeight: '100vh', backgroundColor: '#fff' }}>
                <Box sx={{
                    maxWidth: 820,
                    mx: 'auto',
                    px: { xs: 3, md: 6 },
                    pt: { xs: 10, md: 14 },
                    pb: { xs: 8, md: 12 },
                }}>
                    <Box sx={{ mb: 7 }}>
                        <Typography sx={{ fontSize: { xs: '1.2rem', md: '1.5rem' }, fontWeight: 700, color: '#0f172a', lineHeight: 1.4, mb: 2 }}>
                            «Մադբեյզ» ինտերնետային կայքի թխուկների քաղաքականություն
                        </Typography>
                        <Box sx={{ width: 48, height: 3, bgcolor: '#00ABBE', borderRadius: 2, mb: 3 }} />
                        <Typography sx={{ fontSize: "0.92rem", color: "#4b5563", lineHeight: 1.85 }}>
                            Այս Cookie Policy-ն բացատրում է, թե ինչպես է mudbase.am համակարգն օգտագործում քուքի ֆայլեր և կից ծրագրային լուծումները ՝ կայքում օգտագործողների փորձն առավել արդյունավետ դարձնելու նպատակով:
                        </Typography>
                    </Box>

                <Box sx={{ mb: 5, pb: 5, borderBottom: "1px solid #e5e7eb" }}>
                    <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.14em", color: "#00ABBE", textTransform: "uppercase", mb: 2 }}>
                        1. Ի՞նչ են քուքիները
                    </Typography>
                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                    <Box sx={{ display: "flex", gap: 1.5, mb: 1 }}>
                        <Box component="span" sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "#00ABBE", flexShrink: 0, mt: "9px" }} />
                        <Typography sx={{ fontSize: "0.88rem", color: "#374151", lineHeight: 1.8 }}>Քուքի (cookie) ֆայլերը փոքր տեքստային ֆայլեր են, որոնք պահպանվում են ձեր սարքում, երբ դուք այցելում եք կայք: Դրանք օգնում են հիշել ձեր նախընտրությունները, ակտիվացնել որոշ ֆունկցիաներ և բարելավել օգտատիրոջ փորձը:</Typography>
                    </Box>
                    </Box>
                </Box>

                <Box sx={{ mb: 5, pb: 5, borderBottom: "1px solid #e5e7eb" }}>
                    <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.14em", color: "#00ABBE", textTransform: "uppercase", mb: 2 }}>
                        2. Ինչու ենք մենք օգտագործում քուքիներ
                    </Typography>
                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                    <Box sx={{ display: "flex", gap: 1.5, mb: 1 }}>
                        <Box component="span" sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "#00ABBE", flexShrink: 0, mt: "9px" }} />
                        <Typography sx={{ fontSize: "0.88rem", color: "#374151", lineHeight: 1.8 }}>Մենք օգտագործում ենք քուքիներ հետևյալ նպատակներով՝</Typography>
                    </Box>
                    <Box sx={{ display: "flex", gap: 1.5, mb: 1 }}>
                        <Box component="span" sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "#00ABBE", flexShrink: 0, mt: "9px" }} />
                        <Typography sx={{ fontSize: "0.88rem", color: "#374151", lineHeight: 1.8 }}>Կայքի հիմնական ֆունկցիոնալության ապահովում,</Typography>
                    </Box>
                    <Box sx={{ display: "flex", gap: 1.5, mb: 1 }}>
                        <Box component="span" sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "#00ABBE", flexShrink: 0, mt: "9px" }} />
                        <Typography sx={{ fontSize: "0.88rem", color: "#374151", lineHeight: 1.8 }}>Ձեզ համապատասխան բովանդակության ցուցադրում,</Typography>
                    </Box>
                    <Box sx={{ display: "flex", gap: 1.5, mb: 1 }}>
                        <Box component="span" sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "#00ABBE", flexShrink: 0, mt: "9px" }} />
                        <Typography sx={{ fontSize: "0.88rem", color: "#374151", lineHeight: 1.8 }}>Վերլուծական տվյալների հավաքում՝ կայքը բարելավելու համար:</Typography>
                    </Box>
                    </Box>
                </Box>

                <Box sx={{ mb: 5, pb: 5, borderBottom: "1px solid #e5e7eb" }}>
                    <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.14em", color: "#00ABBE", textTransform: "uppercase", mb: 2 }}>
                        3. Քուքի ֆայլերի տեսակները
                    </Typography>
                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                    <Box sx={{ display: "flex", gap: 1.5, mb: 1 }}>
                        <Box component="span" sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "#00ABBE", flexShrink: 0, mt: "9px" }} />
                        <Typography sx={{ fontSize: "0.88rem", color: "#374151", lineHeight: 1.8 }}>Մենք կարող ենք օգտագործել հետևյալ քուքի տեսակները՝</Typography>
                    </Box>
                    <Box sx={{ display: "flex", gap: 1.5, mb: 1 }}>
                        <Box component="span" sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "#00ABBE", flexShrink: 0, mt: "9px" }} />
                        <Typography sx={{ fontSize: "0.88rem", color: "#374151", lineHeight: 1.8 }}>Անհրաժեշտ քուքիներ – անհրաժեշտ են կայքի գործարկման համար, օրինակ՝ մուտք գործելու կամ ամրագրման գործընթացի ապահովման համար:</Typography>
                    </Box>
                    <Box sx={{ display: "flex", gap: 1.5, mb: 1 }}>
                        <Box component="span" sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "#00ABBE", flexShrink: 0, mt: "9px" }} />
                        <Typography sx={{ fontSize: "0.88rem", color: "#374151", lineHeight: 1.8 }}>Վերլուծական քուքիներ – օգնում են հասկանալ, թե ինչպես են օգտատերերը օգտագործում կայքը:</Typography>
                    </Box>
                    </Box>
                </Box>

                <Box sx={{ mb: 5, pb: 5, borderBottom: "1px solid #e5e7eb" }}>
                    <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.14em", color: "#00ABBE", textTransform: "uppercase", mb: 2 }}>
                        4. Քուքիների կառավարում
                    </Typography>
                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                    <Box sx={{ display: "flex", gap: 1.5, mb: 1 }}>
                        <Box component="span" sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "#00ABBE", flexShrink: 0, mt: "9px" }} />
                        <Typography sx={{ fontSize: "0.88rem", color: "#374151", lineHeight: 1.8 }}>Դուք կարող եք կառավարել կամ ջնջել քուքի ֆայլերը ցանկացած պահի՝ ձեր բրաուզերի կարգավորումներից: Խնդրում ենք նկատի ունենալ, որ որոշ քուքի ֆայլերի անջատումը կարող է ազդել կայքի ֆունկցիոնալության վրա:</Typography>
                    </Box>
                    </Box>
                </Box>

                <Box sx={{ mb: 5, pb: 5, borderBottom: "1px solid #e5e7eb" }}>
                    <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.14em", color: "#00ABBE", textTransform: "uppercase", mb: 2 }}>
                        5. Կողմերից ստացված քուքիներ
                    </Typography>
                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                    <Box sx={{ display: "flex", gap: 1.5, mb: 1 }}>
                        <Box component="span" sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "#00ABBE", flexShrink: 0, mt: "9px" }} />
                        <Typography sx={{ fontSize: "0.88rem", color: "#374151", lineHeight: 1.8 }}>Մենք կարող ենք օգտագործել երրորդ կողմերի ծառայություններ, ինչպիսիք են վերլուծական և գովազդային գործիքները (օրինակ՝ Google, Facebook), որոնք կարող են նույնպես տեղադրել քուքի ֆայլեր ձեր սարքում:</Typography>
                    </Box>
                    </Box>
                </Box>

                <Box sx={{ mb: 5, pb: 5, borderBottom: "1px solid #e5e7eb" }}>
                    <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.14em", color: "#00ABBE", textTransform: "uppercase", mb: 2 }}>
                        6. Քաղաքականության թարմացումներ
                    </Typography>
                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                    <Box sx={{ display: "flex", gap: 1.5, mb: 1 }}>
                        <Box component="span" sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "#00ABBE", flexShrink: 0, mt: "9px" }} />
                        <Typography sx={{ fontSize: "0.88rem", color: "#374151", lineHeight: 1.8 }}>Մենք կարող ենք ժամանակ առ ժամանակ թարմացնել այս քաղաքականությունը՝ համապատասխանեցնելով տեխնոլոգիական կամ օրենսդրական փոփոխություններին:</Typography>
                    </Box>
                    </Box>
                </Box>

                <Box sx={{ mb: 5, pb: 5, borderBottom: "1px solid #e5e7eb" }}>
                    <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.14em", color: "#00ABBE", textTransform: "uppercase", mb: 2 }}>
                        7. Հետադարձ կապ
                    </Typography>
                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                    <Box sx={{ display: "flex", gap: 1.5, mb: 1 }}>
                        <Box component="span" sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "#00ABBE", flexShrink: 0, mt: "9px" }} />
                        <Typography sx={{ fontSize: "0.88rem", color: "#374151", lineHeight: 1.8 }}>Եթե ունեք հարցեր այս Cookie Policy-ի վերաբերյալ, խնդրում ենք կապվել մեզ հետ մեր հետադարձ կապի էջում կամ առցանց զրույցի միջոցով։</Typography>
                    </Box>
                    </Box>
                </Box>

                </Box>
            </Box>
            <Footer />
        </AppProviderWrapper>
    );
}
