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

const CARD_DETAILS: Record<number, { title: string; description: string }> = {
    1: {
        title: 'Նախահաշվային գործիք',
        description: 'Նախahashvayin gortsikը նakhatesvatsd е shinararakan ashkhataнкнери arjeqi hashharkman hamar։ Ayn arranjin gortsik е ev nerarkum е nakhahashivneri kazmman ev khmbagrman hamar anhratesht bolor tstragrayian hnaravoryutyunnere։ Arjeqi dzevagorman ev hashharki irakanacman hamar anhratesht tvatalnere bernutsum en himnakan shtemaranneric, artatsolelov shinararakan ashkhataнкнери ev nyuteri tvyal pahi dryutyamb hashharkvatsd mijinacvatsd arjeknerin։ Нakhahashivatsvatsd nakhahashivi hnaravore е artahanel tvayini tarber dzevachapherov, yste nakhapatkutyun։ Baci avd, himk endunelov nakhahashivayin tvatalnere, hnaravore е shinararakan kapali paymanagri hamar dzevorel ashkhatankeri tsavalatert։',
    },
};

export default function TargetSection() {
    const [flipped, setFlipped] = useState<number | null>(null);
    const [expandedCard, setExpandedCard] = useState<number | null>(null);

    const toggle = (i: number) =>
        setFlipped(prev => (prev === i ? null : i));

    return (
        <Box sx={{
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
                                            <Typography sx={{ fontSize: '0.78rem', color: '#475569', lineHeight: 1.65, display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
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
                                                Փեսնել ավելին
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
                                    justifyContent: 'flex-end',
                                    borderRadius: '18px',
                                    border: `1px solid #00ABBE`,
                                    boxShadow: `0 4px 24px rgba(0,171,190,0.15)`,
                                    backgroundColor: '#fff',
                                    cursor: 'pointer',
                                    pb: 3,
                                }}
                            >
                                <Typography sx={{ fontSize: '0.78rem', color: '#94a3ac', userSelect: 'none' }}>
                                    ‹ Պտտել
                                </Typography>
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
                    sx={{ position: 'fixed', inset: 0, zIndex: 1300, bgcolor: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}
                >
                    <Box
                        onClick={(e: any) => e.stopPropagation()}
                        sx={{
                            bgcolor: 'rgba(255,255,255,0.08)',
                            backdropFilter: 'blur(32px)',
                            WebkitBackdropFilter: 'blur(32px)',
                            borderRadius: '24px',
                            maxWidth: 620,
                            width: '100%',
                            border: '1px solid rgba(255,255,255,0.22)',
                            boxShadow: '0 8px 32px rgba(31,38,135,0.25), 0 2px 8px rgba(0,0,0,0.2)',
                            p: { xs: 3, md: 4 },
                            position: 'relative',
                            maxHeight: '82vh',
                            overflowY: 'auto',
                        }}
                    >
                        <Box
                            onClick={() => setExpandedCard(null)}
                            sx={{ position: 'absolute', top: 14, right: 14, width: 30, height: 30, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', '&:hover': { bgcolor: 'rgba(255,255,255,0.22)' }, flexShrink: 0 }}
                        >
                            <Box component='span' sx={{ color: '#fff', fontSize: '1rem', lineHeight: 1, userSelect: 'none' }}>×</Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5, pr: 4 }}>
                            <Box sx={{ width: 4, height: 32, borderRadius: 2, bgcolor: CARDS[expandedCard]?.iconColor ?? '#00ABBE', flexShrink: 0 }} />
                            <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: CARDS[expandedCard]?.iconColor ?? '#00ABBE', lineHeight: 1.3 }}>
                                {CARD_DETAILS[expandedCard].title}
                            </Typography>
                        </Box>
                        <Typography sx={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.87)', lineHeight: 1.9 }}>
                            {CARD_DETAILS[expandedCard].description}
                        </Typography>
                    </Box>
                </Box>
            )}
        </Box>
    );
}
