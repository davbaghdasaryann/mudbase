'use client';

import { Box, Tooltip, Typography } from '@mui/material';
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined';
import ConstructionOutlinedIcon from '@mui/icons-material/ConstructionOutlined';
import DrawOutlinedIcon from '@mui/icons-material/DrawOutlined';
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';
import { ElementType, useState } from 'react';

const STROKE = '#3FA297';

const CARDS: { Icon: ElementType; circleBg: string; iconColor: string }[] = [
    { Icon: ConstructionOutlinedIcon, circleBg: 'rgba(28,164,97,0.10)',  iconColor: '#00A390' },
    { Icon: ApartmentOutlinedIcon,    circleBg: 'rgba(57,176,117,0.15)', iconColor: '#39B075' },
    { Icon: DrawOutlinedIcon,         circleBg: 'rgba(0,171,190,0.10)',  iconColor: '#00ABBE' },
];

const CARD_DETAILS: Record<number, { title: string; description: string; intro?: string; features?: string[]; callout?: string }> = {
    1: {
        title: 'Նախահաշվային գործիք',
        description: 'Նախահաշվային գործիքը նախատեսված է շինարարական աշխատանքների արժեքի հաշվարկման համար։ Այն առանձին գործիք է և ներառում է նախահաշիվների կազմման և խմբագրման համար անհրաժեշտ բոլոր ծրագրային հնարավորությունները։ Արժեքի ձևավորման և հաշվարկի իրականացման համար անհրաժեշտ տվյալները բեռնվում են հիմնական շտեմարաններից՝ արտացոլելով շինարարական աշխատանքների և նյութերի տվյալ պահի դրությամբ հաշվարկված միջինացված արժեքները։ Հաշվարկված նախահաշիվը հնարավոր է արտահանել թվային տարբեր ձևաչափերով՝ ըստ նախապատվության։ Բացի այդ, հիմք ընդունելով նախահաշվային տվյալները, հնարավոր է շինարարական կապալի պայմանագրի համար ձևավորել աշխատանքների ծավալաթերթ։',
        intro: 'Նախահաշվային գործիքը նախատեսված է շինարարական աշխատանքների արժեքի հաշվարկման համար։',
        features: [
            'Այն առանձին գործիք է և ներառում է նախահաշիվների կազմման և խմբագրման համար անհրաժեշտ բոլոր ծրագրային հնարավորությունները։',
            'Հաշվարկված նախահաշիվը հնարավոր է արտահանել թվային տարբեր ձևաչափերով՝ ըստ նախապատվության։',
            'Բացի այդ, հիմք ընդունելով նախահաշվային տվյալները, հնարավոր է շինարարական կապալի պայմանագրի համար ձևավորել աշխատանքների ծավալաթերթ։',
        ],
        callout: 'Արժեքի ձևավորման և հաշվարկի իրականացման համար անհրաժեշտ տվյալները բեռնվում են հիմնական շտեմարաններից՝ արտացոլելով շինարարական աշխատանքների և նյութերի տվյալ պահի դրությամբ հաշվարկված միջինացված արժեքները։',
    },
    0: {
        title: 'Տվյալների Շտեմարան',
        description: 'Շինարարական աշխատանքների շուկայական արժեքի հաշվարկի համար Մադբեյզ համակարգն առաջարկում է տվյալների երկու հիմնական շտեմարան՝ շինարարական աշխատանքների և շինարարական նյութերի։ Յուրաքանչյուր շտեմարանում պահպանվում են շուկայական արժեքների վերաբերյալ միջինացված տվյալները՝ դասակարգված ըստ տիպերի և առանձնահատկությունների։ Շտեմարաններում առկա տվյալները տրամադրվում են հայաստանյան շուկայում շինարարություն իրականացնող կազմակերպությունների կողմից։ Նոր արժեք մուտքագրվելիս համակարգն ավտոմատ թարմացնում է շտեմարանը և իրական ժամանակում հաշվարկում նոր միջին շուկայական արժեքը, ինչը թույլ է տալիս այլ կազմակերպություններին օգտվել իրական շուկայական տվյալներից։',
        intro: 'Շինարարական աշխատանքների շուկայական արժեքի հաշվարկի համար Մադբեյզ համակարգն առաջարկում է տվյալների երկու հիմնական շտեմարան՝ շինարարական աշխատանքների և շինարարական նյութերի։',
        features: [
            'Յուրաքանչյուր շտեմարանում պահպանվում են շուկայական արժեքների վերաբերյալ միջինացված տվյալները՝ դասակարգված ըստ տիպերի և առանձնահատկությունների։',
            'Շտեմարաններում առկա տվյալները տրամադրվում են հայաստանյան շուկայում շինարարություն իրականացնող կազմակերպությունների կողմից։',
        ],
        callout: 'Նոր արժեք մուտքագրվելիս համակարգն ավտոմատ թարմացնում է շտեմարանը և իրական ժամանակում հաշվարկում նոր միջին շուկայական արժեքը, ինչը թույլ է տալիս այլ կազմակերպություններին օգտվել իրական շուկայական տվյալներից։',
    },
    2: {
        title: 'Խոշորացված Շտեմարան',
        description: 'Խոշորացված շտեմարանում ներկայացված են տարբեր տեսակի օբյեկտների շինարարության խոշորացված արժեքները։ Յուրաքանչյուր հաշվարկի հիմքում ընկած են իրական մշակված նախագծային փաստաթղթերը և վերջիններիս հիման վրա կազմված շինարարական նախահաշիվը։ Արժեքները հաշվարկվում են՝ հիմք ընդունելով հիմնական շտեմարաններում տվյալ պահի դրությամբ առկա տվյալները։ Անհրաժեշտության դեպքում հաշվարկային նախահաշիվները հնարավոր է պատճենել՝ սեփական հաշվարկներ իրականացնելու նպատակով։ Հիմնական շտեմարաններում փոփոխությունների դեպքում համակարգն ինքնաշխատ իրականացնում է արժեքների վերահաշվարկ՝ տրամադրելով միշտ թարմացված տեղեկատվություն։',
        intro: 'Խոշորացված շտեմարանում ներկայացված են տարբեր տեսակի օբյեկտների շինարարության խոշորացված արժեքները։',
        features: [
            'Յուրաքանչյուր հաշվարկի հիմքում ընկած են իրական մշակված նախագծային փաստաթղթերը և վերջիններիս հիման վրա կազմված շինարարական նախահաշիվը։',
            'Արժեքները հաշվարկվում են՝ հիմք ընդունելով հիմնական շտեմարաններում տվյալ պահի դրությամբ առկա տվյալները։',
            'Անհրաժեշտության դեպքում հաշվարկային նախահաշիվները հնարավոր է պատճենել՝ սեփական հաշվարկներ իրականացնելու նպատակով։',
        ],
        callout: 'Հիմնական շտեմարաններում փոփոխությունների դեպքում համակարգն ինքնաշխատ իրականացնում է արժեքների վերահաշվարկ՝ տրամադրելով միշտ թարմացված տեղեկատվություն։',
    },
    3: {
        title: 'Ծախսագրում',
        description: '«Ծախսագրում» գործիքը նախատեսված է շինարարության փաստացի ծախսերի հաշվառման և հաշվարկման համար։ Այս գործիքի միջոցով շինարարական կազմակերպությունը ողջ շինարարության ընթացքում մուտքագրում է իր հիմնական ծախսերի վերաբերյալ տեղեկատվությունը (աշխատավարձեր, մեքենա-մեխանիզմների շահագործման ծախսեր, ենթակապալառուներին վճարված գումարներ)։ Սույն գործիքի միջոցով հնարավոր է իրականացնել պահեստում առկա շինարարական նյութերի քանակական կառավարումը՝ վերահսկելով առկա մնացորդները և փաստացի ծախսը։ Գործիքը ներառում է նաև վերլուծական բաժին, որի միջոցով շինարարության ողջ ընթացքում հնարավոր է հետևել յուրաքանչյուր տեսակի աշխատանքի շահութաբերությանը կամ վնասաբերությանը։ Մուտքագրված բոլոր տվյալների հիման վրա հնարավոր է կազմել ամփոփ ծախսային հաշվարկ, որը թույլ կտա կազմակերպությանը գնահատել իր գործունեության արդյունավետությունը և կայացնել հիմնավորված կառավարչական որոշումներ։',
        intro: '«Ծախսագրում» գործիքը նախատեսված է շինարարության փաստացի ծախսերի հաշվառման և հաշվարկման համար։',
        features: [
            'Այս գործիքի միջոցով շինարարական կազմակերպությունը ողջ շինարարության ընթացքում մուտքագրում է իր հիմնական ծախսերի վերաբերյալ տեղեկատվությունը (աշխատավարձեր, մեքենա-մեխանիզմների շահագործման ծախսեր, ենթակապալառուներին վճարված գումարներ)։',
            'Սույն գործիքի միջոցով հնարավոր է իրականացնել պահեստում առկա շինարարական նյութերի քանակական կառավարումը՝ վերահսկելով առկա մնացորդները և փաստացի ծախսը։',
            'Գործիքը ներառում է նաև վերլուծական բաժին, որի միջոցով շինարարության ողջ ընթացքում հնարավոր է հետևել յուրաքանչյուր տեսակի աշխատանքի շահութաբերությանը կամ վնասաբերությանը։',
        ],
        callout: 'Մուտքագրված բոլոր տվյալների հիման վրա հնարավոր է կազմել ամփոփ ծախսային հաշվարկ, որը թույլ կտա կազմակերպությանը գնահատել իր գործունեության արդյունավետությունը և կայացնել հիմնավորված կառավարչական որոշումներ։',
    },
    4: {
        title: 'Կատարողական',
        description: '«Կատարողական» գործիքը նախատեսված է շինարարական աշխատանքների կատարողականների կազմման համար։ Այս գործիքի միջոցով շինարարական կազմակերպությունը կարող է շինարարության յուրաքանչյուր փուլում ավարտված աշխատանքների հիման վրա կազմել կատարողական ակտեր։ Յուրաքանչյուր նոր կատարողական ակտ կազմելիս համակարգն ինքնաշխատ գումարում է նախկինում մուտքագրված տվյալները՝ ամփոփելով կատարված աշխատանքների ընդհանուր ծավալը։ Միաժամանակ հնարավորություն է տրվում անընդհատ վերահսկել մնացորդային աշխատանքների ծավալները։',
        intro: '«Կատարողական» գործիքը նախատեսված է շինարարական աշխատանքների կատարողականների կազմման համար։',
        features: [
            'Այս գործիքի միջոցով շինարարական կազմակերպությունը կարող է շինարարության յուրաքանչյուր փուլում ավարտված աշխատանքների հիման վրա կազմել կատարողական ակտեր։',
            'Յուրաքանչյուր նոր կատարողական ակտ կազմելիս համակարգն ինքնաշխատ գումարում է նախկինում մուտքագրված տվյալները՝ ամփոփելով կատարված աշխատանքների ընդհանուր ծավալը։',
        ],
        callout: 'Միաժամանակ հնարավորություն է տրվում անընդհատ վերահսկել մնացորդային աշխատանքների ծավալները։',
    },
    5: {
        title: 'Վերլուծություն',
        description: 'Վերլուծության գործիքը նախատեսված է նախահաշվային տվյալների բազմակողմանի ուսումնասիրության համար և ներառում է վերլուծության չորս հիմնական տեսակ՝ կառուցվածքային, համեմատական, ռենտային և ժամանակագրական։ Կառուցվածքային վերլուծությունը թույլ է տալիս ուսումնասիրել հաշվարկված նախահաշվի ծախսային կառուցվածքը՝ աշխատանքների, նյութերի և այլ ծախսերի բաժինն ու քանակական ցուցանիշները։ Համեմատական վերլուծության միջոցով հնարավոր է նախահաշվային տվյալները համադրել համակարգում գրանցված այլ կազմակերպությունների տրամադրած արժեքների հետ, ինչպես նաև համեմատել տարբեր կազմակերպությունների կողմից նույն նախահաշվի համար կատարված հաշվարկները։ Ռենտային վերլուծությունը հնարավորություն է տալիս արագ գնահատել, թե ինչ շահութաբերությամբ կարող է կազմակերպությունն իրականացնել տվյալ շինարարությունը՝ հիմք ընդունելով «Ծախսագրում» գործիքում կամ շտեմարաններում առկա իր սեփական տվյալները։ Ժամանակագրական վերլուծությունը ցույց է տալիս, թե որքան կարժենար տվյալ շինարարությունը տարբեր ժամանակահատվածներում։',
        intro: 'Վերլուծության գործիքը նախատեսված է նախահաշվային տվյալների բազմակողմանի ուսումնասիրության համար և ներառում է վերլուծության չորս հիմնական տեսակ՝ կառուցվածքային, համեմատական, ռենտային և ժամանակագրական։',
        features: [
            'Կառուցվածքային վերլուծությունը թույլ է տալիս ուսումնասիրել հաշվարկված նախահաշվի ծախսային կառուցվածքը՝ աշխատանքների, նյութերի և այլ ծախսերի բաժինն ու քանակական ցուցանիշները։',
            'Համեմատական վերլուծության միջոցով հնարավոր է նախահաշվային տվյալները համադրել համակարգում գրանցված այլ կազմակերպությունների տրամադրած արժեքների հետ, ինչպես նաև համեմատել տարբեր կազմակերպությունների կողմից նույն նախահաշվի համար կատարված հաշվարկները։',
            'Ռենտային վերլուծությունը հնարավորություն է տալիս արագ գնահատել, թե ինչ շահութաբերությամբ կարող է կազմակերպությունն իրականացնել տվյալ շինարարությունը՝ հիմք ընդունելով «Ծախսագրում» գործիքում կամ շտեմարաններում առկա իր սեփական տվյալները։',
        ],
        callout: 'Ժամանակագրական վերլուծությունը ցույց է տալիս, թե որքան կարժենար տվյալ շինարարությունը տարբեր ժամանակահատվածներում։',
    },
    7: {
        title: 'Մոնիթորինգ',
        description: '«Մոնիթորինգ» գործիքը նախատեսված է շուկայական արժեքների փոփոխությունների շարունակական դիտարկման համար։ Այս գործիքի միջոցով կազմակերպությունը կարող է մեկ էջում վիջեթների տեսքով հավաքել իր համար անհրաժեշտ վիճակագրական տվյալները։ Օրինակ՝ հնարավոր է հետևել, թե որքան է տատանվել որևէ շինարարական աշխատանքի արժեքը կամ աշխատանքի ընդհանուր հաշվարկը վերջին 15 կամ 30 օրվա ընթացքում։ Արդյունքում կազմակերպությունը մեկ էջում ստանում է շուկայական արժեքների փոփոխությունների ամփոփ և արագ ընկալելի պատկեր։',
        intro: '«Մոնիթորինգ» գործիքը նախատեսված է շուկայական արժեքների փոփոխությունների շարունակական դիտարկման համար։',
        features: [
            'Այս գործիքի միջոցով կազմակերպությունը կարող է մեկ էջում վիջեթների տեսքով հավաքել իր համար անհրաժեշտ վիճակագրական տվյալները։',
            'Օրինակ՝ հնարավոր է հետևել, թե որքան է տատանվել որևէ շինարարական աշխատանքի արժեքը կամ աշխատանքի ընդհանուր հաշվարկը վերջին 15 կամ 30 օրվա ընթացքում։',
        ],
        callout: 'Արդյունքում կազմակերպությունը մեկ էջում ստանում է շուկայական արժեքների փոփոխությունների ամփոփ և արագ ընկալելի պատկեր։',
    },
};

export default function TargetSection() {
    const [flipped, setFlipped] = useState<number | null>(null);
    const [expandedCard, setExpandedCard] = useState<number | null>(null);

    const toggle = (i: number) =>
        setFlipped(prev => (prev === i ? null : i));

    return (
        <Box id="tools" sx={{
            pt: { xs: 2, md: 3 },
            pb: { xs: 3, md: 4 },
            px: { xs: 3, md: 6 },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            backgroundColor: '#fff',
        }}>
            {/* Pill header */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: { xs: 2, md: 3 } }}>
                <Box sx={{
                    display: 'inline-block',
                    backgroundColor: 'rgba(0,163,144,0.07)',
                    border: '1px solid rgba(0,163,144,0.18)',
                    borderRadius: '100px',
                    px: 2, py: 0.55,
                }}>
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.13em', color: '#00A390', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                        Գործիքներ
                    </Typography>
                </Box>
            </Box>

            {/* Cards layout */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 3 }, width: '100%', maxWidth: 1100 }}>

            {/* Row 1: three cards */}
            <Box sx={{
                display: 'flex',
                gap: { xs: 2, md: 3 },
                width: '100%',
                flexWrap: { xs: 'wrap', md: 'nowrap' },
                justifyContent: 'center',
            }}>
                {CARDS.map(({ Icon, circleBg, iconColor }, i) => (
                    <Box
                        key={i}
                        sx={{
                            flex: '1 1 0',
                            minWidth: { xs: 200, md: 0 },
                            perspective: '1000px',
                        }}
                    >
                        {/* Flip container — square via aspect-ratio */}
                        <Box sx={{
                            position: 'relative',
                            width: '100%',
                            aspectRatio: '1 / 1',
                            transformStyle: 'preserve-3d',
                            transition: 'transform 0.6s cubic-bezier(0.4,0.2,0.2,1)',
                            transform: flipped === i ? 'rotateY(180deg)' : 'rotateY(0deg)',
                        }}>
                            {/* Front face */}
                            <Box
                                onClick={() => toggle(i)}
                                sx={{
                                    position: 'absolute',
                                    inset: 0,
                                    backfaceVisibility: 'hidden',
                                    WebkitBackfaceVisibility: 'hidden',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '18px',
                                    border: `1.5px solid ${STROKE}26`,
                                    boxShadow: '0 4px 24px rgba(63,162,151,0.08), 0 1px 4px rgba(0,0,0,0.03)',
                                    backgroundColor: '#fff',
                                    overflow: 'hidden',
                                    cursor: 'pointer',
                                    gap: 3,
                                    '&:hover': { boxShadow: '0 8px 32px rgba(63,162,151,0.15), 0 2px 8px rgba(0,0,0,0.05)', filter: 'brightness(0.93)' },
                                    transition: 'box-shadow 0.2s, filter 0.2s',
                                }}
                            >
                                {i === 0 ? (
                                    /* First card: bg image only, no icon or button */
                                    <>
                                    <Typography sx={{
                                        position: 'absolute',
                                        top: 20,
                                        left: 0,
                                        right: 0,
                                        textAlign: 'center',
                                        fontWeight: 700,
                                        fontSize: '1rem',
                                        color: '#000',
                                        zIndex: 1,
                                        pointerEvents: 'none',
                                    }}>
                                        Տվյալների շտեմարան
                                    </Typography>
                                    <Box sx={{
                                        position: 'absolute',
                                        inset: 0,
                                        opacity: 1,
                                        backgroundImage: 'url(/images/estimations_card_bg.webp)',
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        pointerEvents: 'none',
                                    }} />
                                    </>
                                ) : i === 2 ? (
                                    /* Third card (moved to last): aggregated bg image */
                                    <>
                                    <Typography sx={{
                                        position: 'absolute',
                                        top: 20,
                                        left: 0,
                                        right: 0,
                                        textAlign: 'center',
                                        fontWeight: 700,
                                        fontSize: '1rem',
                                        color: '#000',
                                        zIndex: 1,
                                        pointerEvents: 'none',
                                    }}>
                                        Խոշորացված շտեմարան
                                    </Typography>
                                    <Box sx={{
                                        position: 'absolute',
                                        inset: 0,
                                        opacity: 1,
                                        backgroundImage: 'url(/images/aggregated_card_bg.webp)',
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        pointerEvents: 'none',
                                    }} />
                                    </>
                                ) : (
                                    /* Second card: estimate tool bg image */
                                    <>
                                    <Typography sx={{
                                        position: 'absolute',
                                        top: 20,
                                        left: 0,
                                        right: 0,
                                        textAlign: 'center',
                                        fontWeight: 700,
                                        fontSize: '1rem',
                                        color: '#000',
                                        zIndex: 1,
                                        pointerEvents: 'none',
                                    }}>
                                        Նախահաշվային գործիք
                                    </Typography>
                                    <Box sx={{
                                        position: 'absolute',
                                        inset: 0,
                                        opacity: 1,
                                        backgroundImage: 'url(/images/estimate_tool_card_bg.webp)',
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        pointerEvents: 'none',
                                    }} />
                                    </>
                                )}
                            </Box>

                            {/* Back face */}
                            <Box
                                onClick={() => toggle(i)}
                                sx={{
                                    position: 'absolute',
                                    inset: 0,
                                    backfaceVisibility: 'hidden',
                                    WebkitBackfaceVisibility: 'hidden',
                                    transform: 'rotateY(180deg)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: CARD_DETAILS[i] ? 'space-between' : 'flex-end',
                                    borderRadius: '18px',
                                    border: `1px solid ${iconColor}`,
                                    boxShadow: `0 4px 24px ${iconColor}26, 0 1px 4px rgba(0,0,0,0.03)`,
                                    backgroundColor: '#fff',
                                    cursor: 'pointer',
                                    py: 3,
                                    px: 2.5,
                                }}
                            >
                                {CARD_DETAILS[i] ? (
                                    <>
                                        <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b', mb: 1, alignSelf: 'flex-start', lineHeight: 1.3 }}>
                                            {CARD_DETAILS[i].title}
                                        </Typography>
                                        <Box sx={{ flex: 1, width: '100%', overflow: 'hidden', position: 'relative', mb: 1.5 }}>
                                            <Typography sx={{ fontSize: '0.88rem', color: '#475569', lineHeight: 1.65, display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                {CARD_DETAILS[i].description}
                                            </Typography>
                                            <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 32, background: 'linear-gradient(transparent, #fff)', pointerEvents: 'none' }} />
                                        </Box>
                                        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                            <Box
                                                component='button'
                                                onClick={(e: any) => { e.stopPropagation(); setExpandedCard(i); }}
                                                sx={{ border: 'none', bgcolor: iconColor, color: '#fff', borderRadius: '8px', px: 2.5, py: 0.8, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', width: '100%', '&:hover': { filter: 'brightness(0.9)' } }}
                                            >
                                                Տեսնել ավելին
                                            </Box>
                                            <Typography sx={{ fontSize: '0.75rem', color: '#94a3ac', userSelect: 'none', '&:hover': { color: '#00ABBE' } }}>
                                                ‹ Պտտել
                                            </Typography>
                                        </Box>
                                    </>
                                ) : (
                                    <Typography sx={{ fontSize: '0.78rem', color: '#94a3ac', userSelect: 'none', transition: 'color 0.15s', '&:hover': { color: '#00ABBE' } }}>
                                        ‹ Պտտել
                                    </Typography>
                                )}
                            </Box>
                        </Box>
                    </Box>
                ))}
            </Box>

            {/* Row 2: Costing, Performance, Analysis */}
            <Box sx={{
                display: 'flex',
                gap: { xs: 2, md: 3 },
                width: '100%',
                flexWrap: { xs: 'wrap', md: 'nowrap' },
                justifyContent: 'center',
            }}>
                {[
                    { idx: 3, label: 'Ծախսագրում',     bg: '/images/costing_card_bg.webp' },
                    { idx: 4, label: 'Կատարողական', bg: '/images/performance_card_bg.webp' },
                    { idx: 5, label: 'Վերլուծություններ', bg: '/images/analysis_card_bg.webp' },
                ].map(({ idx, label, bg }) => (
                    <Box key={idx} sx={{ flex: '1 1 0', minWidth: { xs: 200, md: 0 }, perspective: '1000px' }}>
                        <Box sx={{
                            position: 'relative',
                            width: '100%',
                            aspectRatio: '1 / 1',
                            transformStyle: 'preserve-3d',
                            transition: 'transform 0.6s cubic-bezier(0.4,0.2,0.2,1)',
                            transform: flipped === idx ? 'rotateY(180deg)' : 'rotateY(0deg)',
                        }}>
                            {/* Front face */}
                            <Box
                                onClick={() => toggle(idx)}
                                sx={{
                                    position: 'absolute',
                                    inset: 0,
                                    backfaceVisibility: 'hidden',
                                    WebkitBackfaceVisibility: 'hidden',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '18px',
                                    border: `1.5px solid rgba(63,162,151,0.15)`,
                                    boxShadow: '0 4px 24px rgba(63,162,151,0.08), 0 1px 4px rgba(0,0,0,0.03)',
                                    backgroundColor: '#fff',
                                    overflow: 'hidden',
                                    cursor: 'pointer',
                                    '&:hover': { boxShadow: '0 8px 32px rgba(63,162,151,0.15), 0 2px 8px rgba(0,0,0,0.05)', filter: 'brightness(0.93)' },
                                    '&:hover .beta-pill': { backgroundColor: 'rgba(0,171,190,0.12)' },
                                    transition: 'box-shadow 0.2s, filter 0.2s',
                                }}
                            >
                                <Typography sx={{
                                    position: 'absolute',
                                    top: 20,
                                    left: 0,
                                    right: 0,
                                    textAlign: 'center',
                                    fontWeight: 700,
                                    fontSize: '1rem',
                                    color: '#000',
                                    zIndex: 1,
                                    pointerEvents: 'none',
                                }}>
                                    {label}
                                </Typography>
                                {bg && (
                                    <Box sx={{
                                        position: 'absolute',
                                        inset: 0,
                                        backgroundImage: `url(${bg})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        pointerEvents: 'none',
                                    }} />
                                )}
                                {idx === 5 && (
                                    <Box className='beta-pill' sx={{
                                        position: 'absolute',
                                        top: 10,
                                        right: 10,
                                        zIndex: 2,
                                        width: 28,
                                        height: 28,
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        bgcolor: 'rgba(0,171,190,0.12)',
                                        border: '1px solid rgba(0,171,190,0.35)',
                                        pointerEvents: 'none',
                                    }}>
                                        <Box component='span' sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#00ABBE', lineHeight: 1 }}>
                                            β
                                        </Box>
                                    </Box>
                                )}
                            </Box>
                            {/* Back face */}
            <Box
                onClick={() => toggle(idx)}
                sx={{
                    position: 'absolute',
                    inset: 0,
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: CARD_DETAILS[idx] ? 'space-between' : 'flex-end',
                    borderRadius: '18px',
                    border: `1px solid #00ABBE`,
                    boxShadow: `0 4px 24px rgba(0,171,190,0.15)`,
                    backgroundColor: '#fff',
                    cursor: 'pointer',
                    py: 3, px: 2.5,
                }}
            >
                {CARD_DETAILS[idx] ? (
                    <>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b', mb: 1, alignSelf: 'flex-start', lineHeight: 1.3 }}>
                            {CARD_DETAILS[idx].title}
                        </Typography>
                        <Box sx={{ flex: 1, width: '100%', overflow: 'hidden', position: 'relative', mb: 1.5 }}>
                            <Typography sx={{ fontSize: '0.88rem', color: '#475569', lineHeight: 1.65, display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {CARD_DETAILS[idx].description}
                            </Typography>
                            <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 32, background: 'linear-gradient(transparent, #fff)', pointerEvents: 'none' }} />
                        </Box>
                        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                            <Box
                                component='button'
                                onClick={(e: any) => { e.stopPropagation(); setExpandedCard(idx); }}
                                sx={{ border: 'none', bgcolor: '#00ABBE', color: '#fff', borderRadius: '8px', px: 2.5, py: 0.8, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', width: '100%', '&:hover': { filter: 'brightness(0.9)' } }}
                            >
                                Տեսնել ավելին
                            </Box>
                            <Typography sx={{ fontSize: '0.75rem', color: '#94a3ac', userSelect: 'none', '&:hover': { color: '#00ABBE' } }}>
                                ‹ Պտտել
                            </Typography>
                        </Box>
                    </>
                ) : (
                    <Typography sx={{ fontSize: '0.78rem', color: '#94a3ac', userSelect: 'none', transition: 'color 0.15s', '&:hover': { color: '#00ABBE' } }}>
                        ‹ Պտտել
                    </Typography>
                )}
            </Box>
                        </Box>
                    </Box>
                ))}
            </Box>

            {/* Row 3: Monitoring, Schedule, Project Management */}
            <Box sx={{ display: "flex", gap: { xs: 2, md: 3 }, width: "100%", flexWrap: { xs: "wrap", md: "nowrap" }, justifyContent: "center" }}>
                <Box key={6} sx={{ flex: "1 1 0", minWidth: { xs: 200, md: 0 }, perspective: "1000px" }}>
                    <Box sx={{
                        position: "relative",
                        width: "100%",
                        aspectRatio: "1 / 1",
                        transformStyle: "preserve-3d",
                        transition: "transform 0.6s cubic-bezier(0.4,0.2,0.2,1)",
                        transform: flipped === 6 ? "rotateY(180deg)" : "rotateY(0deg)",
                    }}>
                        {/* Front face */}
                        <Tooltip title="Մշակման փուլում" placement="top" arrow>
                        <Box
                            sx={{
                                position: "absolute",
                                inset: 0,
                                backfaceVisibility: "hidden",
                                WebkitBackfaceVisibility: "hidden",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                borderRadius: "18px",
                                border: "1.5px solid rgba(63,162,151,0.15)",
                                boxShadow: "0 4px 24px rgba(63,162,151,0.08), 0 1px 4px rgba(0,0,0,0.03)",
                                backgroundColor: "#fff",
                                overflow: "hidden",
                                cursor: "help",
                                "&:hover": { boxShadow: "0 8px 32px rgba(63,162,151,0.15), 0 2px 8px rgba(0,0,0,0.05)" },
                                transition: "box-shadow 0.2s",
                            }}
                        >
                            <Typography sx={{
                                position: "absolute",
                                top: 20,
                                left: 0,
                                right: 0,
                                textAlign: "center",
                                fontWeight: 700,
                                fontSize: "1rem",
                                color: "#000",
                                zIndex: 1,
                                pointerEvents: "none",
                            }}>
                                Ժամանակացույց
                            </Typography>
                            <Box sx={{
                                position: "absolute",
                                inset: 0,
                                backgroundImage: "url(/images/schedule_card_bg.webp)",
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                                pointerEvents: "none",
                            }} />
                            <Box sx={{
                                position: "absolute",
                                top: 10,
                                right: 10,
                                zIndex: 2,
                                bgcolor: "rgba(255,152,0,0.12)",
                                border: "1px solid rgba(255,152,0,0.35)",
                                borderRadius: "50%",
                                width: 28,
                                height: 28,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                pointerEvents: "none",
                            }}>
                                <BuildOutlinedIcon sx={{ fontSize: 15, color: "#e65100" }} />
                            </Box>
                        </Box>
                        </Tooltip>
                        {/* Back face */}
                        <Box
                            onClick={() => toggle(6)}
                            sx={{
                                position: "absolute",
                                inset: 0,
                                backfaceVisibility: "hidden",
                                WebkitBackfaceVisibility: "hidden",
                                transform: "rotateY(180deg)",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "flex-end",
                                borderRadius: "18px",
                                border: "1px solid #00ABBE",
                                boxShadow: "0 4px 24px rgba(0,171,190,0.15)",
                                backgroundColor: "#fff",
                                cursor: "pointer",
                                pb: 3,
                            }}
                        >
                            <Typography sx={{ fontSize: "0.78rem", color: "#94a3ac", userSelect: "none" }}>
                                ‹ Պտտել
                            </Typography>
                        </Box>
                    </Box>
                </Box>
                <Box key={7} sx={{ flex: "1 1 0", minWidth: { xs: 200, md: 0 }, perspective: "1000px" }}>
                    <Box sx={{
                        position: "relative",
                        width: "100%",
                        aspectRatio: "1 / 1",
                        transformStyle: "preserve-3d",
                        transition: "transform 0.6s cubic-bezier(0.4,0.2,0.2,1)",
                        transform: flipped === 7 ? "rotateY(180deg)" : "rotateY(0deg)",
                    }}>
                        {/* Front face */}
                        <Box
                            onClick={() => toggle(7)}
                            sx={{
                                position: "absolute",
                                inset: 0,
                                backfaceVisibility: "hidden",
                                WebkitBackfaceVisibility: "hidden",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                borderRadius: "18px",
                                border: "1.5px solid rgba(63,162,151,0.15)",
                                boxShadow: "0 4px 24px rgba(63,162,151,0.08), 0 1px 4px rgba(0,0,0,0.03)",
                                backgroundColor: "#fff",
                                overflow: "hidden",
                                cursor: "pointer",
                                "&:hover": { boxShadow: "0 8px 32px rgba(63,162,151,0.15), 0 2px 8px rgba(0,0,0,0.05)", filter: "brightness(0.93)" },
                                transition: "box-shadow 0.2s, filter 0.2s",
                            }}
                        >
                            <Typography sx={{
                                position: "absolute",
                                top: 20,
                                left: 0,
                                right: 0,
                                textAlign: "center",
                                fontWeight: 700,
                                fontSize: "1rem",
                                color: "#000",
                                zIndex: 1,
                                pointerEvents: "none",
                            }}>
                                Մոնիթորինգ
                            </Typography>
                            <Box sx={{
                                position: "absolute",
                                inset: 0,
                                backgroundImage: "url(/images/monitoring_card_bg.webp)",
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                                pointerEvents: "none",
                            }} />

                            <Box sx={{
                                position: 'absolute',
                                top: 10,
                                right: 10,
                                zIndex: 2,
                                width: 28,
                                height: 28,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: 'rgba(0,171,190,0.12)',
                                border: '1px solid rgba(0,171,190,0.35)',
                                pointerEvents: 'none',
                            }}>
                                <Box component='span' sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#00ABBE', lineHeight: 1 }}>
                                    β
                                </Box>
                            </Box>
                        </Box>
                        {/* Back face */}
                        <Box
                            onClick={() => toggle(7)}
                            sx={{
                                position: 'absolute',
                                inset: 0,
                                backfaceVisibility: 'hidden',
                                WebkitBackfaceVisibility: 'hidden',
                                transform: 'rotateY(180deg)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                borderRadius: '18px',
                                border: '1px solid #00ABBE',
                                boxShadow: '0 4px 24px rgba(0,171,190,0.15)',
                                backgroundColor: '#fff',
                                cursor: 'pointer',
                                py: 3, px: 2.5,
                            }}
                        >
                            <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b', mb: 1, alignSelf: 'flex-start', lineHeight: 1.3 }}>
                                {CARD_DETAILS[7].title}
                            </Typography>
                            <Box sx={{ flex: 1, width: '100%', overflow: 'hidden', position: 'relative', mb: 1.5 }}>
                                <Typography sx={{ fontSize: '0.88rem', color: '#475569', lineHeight: 1.65, display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {CARD_DETAILS[7].description}
                                </Typography>
                                <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 32, background: 'linear-gradient(transparent, #fff)', pointerEvents: 'none' }} />
                            </Box>
                            <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                <Box
                                    component='button'
                                    onClick={(e: any) => { e.stopPropagation(); setExpandedCard(7); }}
                                    sx={{ border: 'none', bgcolor: '#00ABBE', color: '#fff', borderRadius: '8px', px: 2.5, py: 0.8, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', width: '100%', '&:hover': { filter: 'brightness(0.9)' } }}
                                >
                                    Տեսնել ավելին
                                </Box>
                                <Typography sx={{ fontSize: '0.75rem', color: '#94a3ac', userSelect: 'none', '&:hover': { color: '#00ABBE' } }}>
                                    ‹ Պտտել
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                </Box>
                <Box key={8} sx={{ flex: "1 1 0", minWidth: { xs: 200, md: 0 }, perspective: "1000px" }}>
                    <Box sx={{
                        position: "relative",
                        width: "100%",
                        aspectRatio: "1 / 1",
                        transformStyle: "preserve-3d",
                        transition: "transform 0.6s cubic-bezier(0.4,0.2,0.2,1)",
                        transform: flipped === 8 ? "rotateY(180deg)" : "rotateY(0deg)",
                    }}>
                        {/* Front face */}
                        <Tooltip title="Մշակման փուլում" placement="top" arrow>
                        <Box
                            sx={{
                                position: "absolute",
                                inset: 0,
                                backfaceVisibility: "hidden",
                                WebkitBackfaceVisibility: "hidden",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                borderRadius: "18px",
                                border: "1.5px solid rgba(63,162,151,0.15)",
                                boxShadow: "0 4px 24px rgba(63,162,151,0.08), 0 1px 4px rgba(0,0,0,0.03)",
                                backgroundColor: "#fff",
                                overflow: "hidden",
                                cursor: "help",
                                "&:hover": { boxShadow: "0 8px 32px rgba(63,162,151,0.15), 0 2px 8px rgba(0,0,0,0.05)" },
                                transition: "box-shadow 0.2s",
                            }}
                        >
                            <Typography sx={{
                                position: "absolute",
                                top: 20,
                                left: 0,
                                right: 0,
                                textAlign: "center",
                                fontWeight: 700,
                                fontSize: "1rem",
                                color: "#000",
                                zIndex: 1,
                                pointerEvents: "none",
                            }}>
                                Նախագծերի կառավարում
                            </Typography>
                            <Box sx={{
                                position: 'absolute',
                                inset: 0,
                                backgroundImage: 'url(/images/projectmanagement_card_bg.webp)',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                borderRadius: '18px',
                                pointerEvents: 'none',
                            }} />
                            <Box sx={{
                                position: "absolute",
                                top: 10,
                                right: 10,
                                zIndex: 2,
                                bgcolor: "rgba(255,152,0,0.12)",
                                border: "1px solid rgba(255,152,0,0.35)",
                                borderRadius: "50%",
                                width: 28,
                                height: 28,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                pointerEvents: "none",
                            }}>
                                <BuildOutlinedIcon sx={{ fontSize: 15, color: "#e65100" }} />
                            </Box>
                        </Box>
                        </Tooltip>
                        {/* Back face */}
                        <Box
                            onClick={() => toggle(8)}
                            sx={{
                                position: "absolute",
                                inset: 0,
                                backfaceVisibility: "hidden",
                                WebkitBackfaceVisibility: "hidden",
                                transform: "rotateY(180deg)",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "flex-end",
                                borderRadius: "18px",
                                border: "1px solid #00ABBE",
                                boxShadow: "0 4px 24px rgba(0,171,190,0.15)",
                                backgroundColor: "#fff",
                                cursor: "pointer",
                                pb: 3,
                            }}
                        >
                            <Typography sx={{ fontSize: "0.78rem", color: "#94a3ac", userSelect: "none" }}>
                                ‹ Պտտել
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </Box>

            {/* Row 4: Risk Monitoring */}
            <Box sx={{ display: "flex", gap: { xs: 2, md: 3 }, width: "100%", flexWrap: { xs: "wrap", md: "nowrap" }, justifyContent: "center" }}>
                <Box key={9} sx={{ flex: "0 0 calc(33.33% - 8px)", minWidth: { xs: 200, md: 0 }, maxWidth: { xs: "100%", md: "calc(33.33% - 8px)" }, perspective: "1000px" }}>
                    <Box sx={{
                        position: "relative",
                        width: "100%",
                        aspectRatio: "1 / 1",
                        transformStyle: "preserve-3d",
                        transition: "transform 0.6s cubic-bezier(0.4,0.2,0.2,1)",
                        transform: flipped === 9 ? "rotateY(180deg)" : "rotateY(0deg)",
                    }}>
                                                {/* Front face */}
                        <Tooltip title="Մշակման փուլում" placement="top" arrow>
                        <Box
                            sx={{
                                position: "absolute",
                                inset: 0,
                                backfaceVisibility: "hidden",
                                WebkitBackfaceVisibility: "hidden",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                borderRadius: "18px",
                                border: "1.5px solid rgba(63,162,151,0.15)",
                                boxShadow: "0 4px 24px rgba(63,162,151,0.08), 0 1px 4px rgba(0,0,0,0.03)",
                                backgroundColor: "#fff",
                                overflow: "hidden",
                                cursor: "help",
                                "&:hover": { boxShadow: "0 8px 32px rgba(63,162,151,0.15), 0 2px 8px rgba(0,0,0,0.05)" },
                                transition: "box-shadow 0.2s",
                            }}
                        >
                            <Typography sx={{
                                position: "absolute",
                                top: 20,
                                left: 0,
                                right: 0,
                                textAlign: "center",
                                fontWeight: 700,
                                fontSize: "1rem",
                                color: "#000",
                                zIndex: 1,
                                pointerEvents: "none",
                            }}>
                                Ռիսկերի մոնիթորինգ
                            </Typography>
                            <Box sx={{
                                position: 'absolute',
                                inset: 0,
                                backgroundImage: 'url(/images/riskmonitoring_card_bg.webp)',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                borderRadius: '18px',
                                pointerEvents: 'none',
                            }} />
                            <Box sx={{
                                position: "absolute",
                                top: 10,
                                right: 10,
                                zIndex: 2,
                                bgcolor: "rgba(255,152,0,0.12)",
                                border: "1px solid rgba(255,152,0,0.35)",
                                borderRadius: "50%",
                                width: 28,
                                height: 28,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                pointerEvents: "none",
                            }}>
                                <BuildOutlinedIcon sx={{ fontSize: 15, color: "#e65100" }} />
                            </Box>
                        </Box>
                        </Tooltip>
                        {/* Back face */}
                        <Box
                            onClick={() => toggle(9)}
                            sx={{
                                position: "absolute",
                                inset: 0,
                                backfaceVisibility: "hidden",
                                WebkitBackfaceVisibility: "hidden",
                                transform: "rotateY(180deg)",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "flex-end",
                                borderRadius: "18px",
                                border: "1px solid #00ABBE",
                                boxShadow: "0 4px 24px rgba(0,171,190,0.15)",
                                backgroundColor: "#fff",
                                cursor: "pointer",
                                pb: 3,
                            }}
                        >
                            <Typography sx={{ fontSize: "0.78rem", color: "#94a3ac", userSelect: "none" }}>
                                ‹ Պտտել
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </Box>

            </Box>

            {/* Glassmorphism modal */}
            {expandedCard !== null && CARD_DETAILS[expandedCard] && (
                <Box
                    onClick={() => setExpandedCard(null)}
                    sx={{ position: 'fixed', inset: 0, zIndex: 1300, bgcolor: 'rgba(0,0,0,0.50)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', p: { xs: 2, md: 3 } }}
                >
                    <Box
                        onClick={(e: any) => e.stopPropagation()}
                        sx={{
                            bgcolor: 'rgba(14,24,36,0.18)',
                            backdropFilter: 'blur(32px)',
                            WebkitBackdropFilter: 'blur(32px)',
                            borderRadius: '20px',
                            maxWidth: 820,
                            width: '100%',
                            border: '1px solid rgba(255,255,255,0.12)',
                            boxShadow: '0 8px 48px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.3)',
                            position: 'relative',
                            maxHeight: '88vh',
                            display: 'flex',
                            flexDirection: { xs: 'column', md: 'row' } as any,
                            overflow: 'hidden',
                        }}
                    >
                        {/* Close */}
                        <Box onClick={() => setExpandedCard(null)} sx={{ position: 'absolute', top: 14, right: 14, zIndex: 2, width: 30, height: 30, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', '&:hover': { bgcolor: 'rgba(255,255,255,0.20)' } }}>
                            <Box component='span' sx={{ color: '#fff', fontSize: '1rem', lineHeight: 1, userSelect: 'none' }}>×</Box>
                        </Box>
                        {/* Left panel */}
                        <Box sx={{ width: { xs: '100%', md: '37%' }, flexShrink: 0, p: { xs: 3, md: 3.5 }, borderRight: { md: '1px solid rgba(255,255,255,0.08)' }, borderBottom: { xs: '1px solid rgba(255,255,255,0.08)', md: 'none' }, display: 'flex', flexDirection: 'column', gap: 2.5, pr: { xs: 3, md: 4.5 } }}>
                            <Box sx={{ width: 54, height: 54, borderRadius: '50%', bgcolor: CARDS[expandedCard]?.circleBg ?? 'rgba(0,171,190,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {expandedCard < CARDS.length && (() => { const { Icon, iconColor } = CARDS[expandedCard]; return <Icon sx={{ fontSize: 27, color: iconColor }} />; })()}
                            </Box>
                            <Typography sx={{ fontWeight: 700, fontSize: '1.15rem', color: '#fff', lineHeight: 1.35, pr: 1 }}>
                                {CARD_DETAILS[expandedCard].title}
                            </Typography>
                            <Typography sx={{ fontSize: '0.83rem', color: 'rgba(255,255,255,0.50)', lineHeight: 1.82 }}>
                                {CARD_DETAILS[expandedCard].intro ?? CARD_DETAILS[expandedCard].description}
                            </Typography>
                        </Box>
                        {/* Right panel */}
                        <Box sx={{ flex: 1, p: { xs: 3, md: 3.5 }, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            {CARD_DETAILS[expandedCard].features ? (
                                <>
                                    {(CARD_DETAILS[expandedCard].features as string[]).map((feat: string, fi: number) => (
                                        <Box key={fi} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', p: 1.5, borderRadius: '12px', bgcolor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                            <Box sx={{ width: 22, height: 22, borderRadius: '50%', bgcolor: CARDS[expandedCard]?.circleBg ?? 'rgba(57,176,117,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, mt: '2px' }}>
                                                <Box component='span' sx={{ color: CARDS[expandedCard]?.iconColor ?? '#39B075', fontSize: '0.68rem', fontWeight: 800, lineHeight: 1 }}>✓</Box>
                                            </Box>
                                            <Typography sx={{ fontSize: '0.83rem', color: 'rgba(255,255,255,0.80)', lineHeight: 1.75 }}>
                                                {feat}
                                            </Typography>
                                        </Box>
                                    ))}
                                    {CARD_DETAILS[expandedCard].callout && (
                                        <Box sx={{ borderLeft: `3px solid ${CARDS[expandedCard]?.iconColor ?? '#39B075'}`, pl: 2, py: 1.5, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: '0 10px 10px 0', mt: 0.5 }}>
                                            <Typography sx={{ fontSize: '0.80rem', color: 'rgba(255,255,255,0.50)', lineHeight: 1.82, fontStyle: 'italic' }}>
                                                {CARD_DETAILS[expandedCard].callout}
                                            </Typography>
                                        </Box>
                                    )}
                                </>
                            ) : (
                                <Typography sx={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.87)', lineHeight: 1.9 }}>
                                    {CARD_DETAILS[expandedCard].description}
                                </Typography>
                            )}
                        </Box>
                    </Box>
                </Box>
            )}
        </Box>
    );
}
