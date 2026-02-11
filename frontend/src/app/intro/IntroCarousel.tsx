import { useState } from 'react';
import Image from 'next/image';
import { Box, Button, Typography } from '@mui/material';
import { Gradient } from '@mui/icons-material';
import { useRouter } from 'next/navigation';

interface Slide {
  titleParts: { text: string; highlight?: boolean }[];
  buttonText: string;
  imageSrc: string;
  reverse: boolean;
}

const slides: Slide[] = [
  {
    titleParts: [
      { text: 'Շինարարական աշխատանքների ' },
      { text: 'արժեքի ', highlight: true },
      { text: 'հաշվարկման և վերլուծության էլեկտրոնային համակարգ' },
    ],
    buttonText: 'Գրանցվել հիմա',
    imageSrc: '/images/intro/metrics.svg',
    reverse: false,
  },
  {
    titleParts: [
      { text: 'Գրանցիր հիմա և ստացիր ' },
      { text: '30 օր անվճար', highlight: true },
      { text: ' օգտվելու հնարավորություն' },
    ],
    buttonText: 'Ստանալ առաջարկ',
    imageSrc: '/images/intro/undraw_complete-form_aarh_1.svg',
    reverse: true,
  },
];

export default function Carousel() {
  const router = useRouter();
  const [active, setActive] = useState(0);

  return (
    <Box position="relative" overflow="hidden" sx={{ width: '100vw', background: "linear-gradient(to bottom, #DAE9EA, #EDF4F4, #FFFEFE)" }}>
      <Box
        sx={{
          display: 'flex',
          width: `${slides.length * 100}vw`,
          transform: `translateX(-${active * 100}vw)`,
          transition: 'transform 0.5s ease-in-out',
        }}
      >
        {slides.map((slide, i) => (
          <Box
            key={i}
            sx={{
              minWidth: '100vw',
              display: 'flex',
              flexDirection: slide.reverse ? 'row-reverse' : 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: { xs: 2, md: 8 },
              py: { xs: 4, md: 8 },
            }}
          >
            <Box maxWidth={600}>
              <Typography variant="h4" gutterBottom sx={{ color: '#282828', fontWeight: 600 }}>
                {slide.titleParts.map((part, idx) => (
                  <Box
                    key={idx}
                    component="span"
                    sx={{ color: part.highlight ? '#00A390' : '#282828' }}
                  >
                    {part.text}
                  </Box>
                ))}
              </Typography>
              <Button
                onClick={() => { router.push('/signup') }}
                variant="contained"
                size="large"
                sx={{
                  mt: 2,
                  bgcolor: '#00A390',
                  color: '#F5F7FA',
                  '&:hover': { bgcolor: '#008f7c' },
                }}
              >
                {slide.buttonText}
              </Button>
            </Box>

            <Box>
              <Image
                src={slide.imageSrc}
                alt={`Slide ${i + 1}`}
                width={500}
                height={350}
                style={{ objectFit: 'contain' }}
              />
            </Box>
          </Box>
        ))}
      </Box>

      <Box
        position="absolute"
        bottom={16}
        left="50%"
        sx={{ transform: 'translateX(-50%)', display: 'flex', gap: 1 }}
      >
        {slides.map((_, idx) => (
          <Box
            key={idx}
            onClick={() => setActive(idx)}
            sx={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              bgcolor: active === idx ? '#00A390' : '#DAE9EA',

              cursor: 'pointer',
            }}
          />
        ))}
      </Box>
    </Box>
  );
}