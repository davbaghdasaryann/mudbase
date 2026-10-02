'use client';

import { Box, Typography } from '@mui/material';
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

export default function TargetSection() {
    const [flipped, setFlipped] = useState<number | null>(null);

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
                                    justifyContent: 'flex-end',
                                    borderRadius: '18px',
                                    border: `1px solid ${iconColor}`,
                                    boxShadow: `0 4px 24px ${iconColor}26, 0 1px 4px rgba(0,0,0,0.03)`,
                                    backgroundColor: '#fff',
                                    cursor: 'pointer',
                                    pb: 3,
                                }}
                            >
                                <Typography sx={{
                                    fontSize: '0.78rem',
                                    color: '#94a3ac',
                                    userSelect: 'none',
                                    transition: 'color 0.15s',
                                    '&:hover': { color: '#00ABBE' },
                                }}>
                                    ‹ Պտտել
                                </Typography>
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
                                        top: 16,
                                        right: 12,
                                        zIndex: 2,
                                        width: 24,
                                        height: 24,
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: 'transparent',
                                        transition: 'background-color 0.2s',
                                        pointerEvents: 'none',
                                    }}>
                                        <Box component='span' sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#00ABBE', lineHeight: 1 }}>
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
                        <Box
                            onClick={() => toggle(6)}
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
                        </Box>
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
                        <Box
                            onClick={() => toggle(8)}
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
                                    '&:hover .beta-pill': { backgroundColor: 'rgba(0,171,190,0.12)' },
                                    '&:hover .dev-stage-text': { opacity: 1 },
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
                                Նախագծերի կառավարում
                            </Typography>
                                {(
                                    <Box className='beta-pill' sx={{
                                        position: 'absolute',
                                        top: 16,
                                        right: 12,
                                        zIndex: 2,
                                        width: 24,
                                        height: 24,
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: 'transparent',
                                        transition: 'background-color 0.2s',
                                        pointerEvents: 'none',
                                    }}>
                                        <Box component='span' sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#00ABBE', lineHeight: 1 }}>
                                            🛠
                                        </Box>
                                    </Box>
                                )}
                            <Box className='dev-stage-text' sx={{
                                position: 'absolute',
                                bottom: 16,
                                left: 0,
                                right: 0,
                                textAlign: 'center',
                                opacity: 0,
                                transition: 'opacity 0.2s',
                                pointerEvents: 'none',
                            }}>
                                <Typography sx={{ fontSize: '0.75rem', color: '#00ABBE', fontWeight: 600, pointerEvents: 'none' }}>
                                    Մշակման փուլում
                                </Typography>
                            </Box>
                        </Box>
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
                        <Box
                            onClick={() => toggle(9)}
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
                                    '&:hover .beta-pill': { backgroundColor: 'rgba(0,171,190,0.12)' },
                                    '&:hover .dev-stage-text': { opacity: 1 },
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
                                Ռիսկերի մոնիթորինգ
                            </Typography>
                                {(
                                    <Box className='beta-pill' sx={{
                                        position: 'absolute',
                                        top: 16,
                                        right: 12,
                                        zIndex: 2,
                                        width: 24,
                                        height: 24,
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: 'transparent',
                                        transition: 'background-color 0.2s',
                                        pointerEvents: 'none',
                                    }}>
                                        <Box component='span' sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#00ABBE', lineHeight: 1 }}>
                                            🛠
                                        </Box>
                                    </Box>
                                )}
                            <Box className='dev-stage-text' sx={{
                                position: 'absolute',
                                bottom: 16,
                                left: 0,
                                right: 0,
                                textAlign: 'center',
                                opacity: 0,
                                transition: 'opacity 0.2s',
                                pointerEvents: 'none',
                            }}>
                                <Typography sx={{ fontSize: '0.75rem', color: '#00ABBE', fontWeight: 600, pointerEvents: 'none' }}>
                                    Մշակման փուլում
                                </Typography>
                            </Box>
                        </Box>
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
        </Box>
    );
}
