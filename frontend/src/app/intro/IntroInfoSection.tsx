// components/InfoSection.tsx
import Image from 'next/image';
import { Box, Typography } from '@mui/material';

export default function InfoSection() {
  return (
    <Box
      component="section"
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        alignItems: 'center',
        background: "linear-gradient(to bottom, #FFFEFE, #ECF3F1)",
        px: { xs: 2, md: 8 },
        py: { xs: 6, md: 12 },
        gap: { xs: 4, md: 8 },
      }}
    >
      <Box
        sx={{
          flex: '1 1 50%',
          display: 'flex',
          justifyContent: { xs: 'center', md: 'flex-start' },
        }}
      >
        <Image
          src="/images/intro/system_work.svg"
          alt="Մոդուլի առանձնահատկություններ"
          width={600}
          height={450}
          style={{ objectFit: 'contain' }}
        />
      </Box>

      <Box
        sx={{
          flex: '1 1 50%',
          maxWidth: 600,
          textAlign: { xs: 'center', md: 'left' },
        }}
      >
        <Typography
          component="h2"
          variant="h3"
          gutterBottom
          sx={{ fontWeight: 700, color: '#282828', lineHeight: 1.2 }}
        >
          <Box component="span" sx={{ color: '#00A390' }}>
            Ինչի համար է
          </Box>{' '}
          <Box component="span">նախատեսված Մադբեյզը</Box>
        </Typography>

        <Typography
          variant="body1"
          sx={{
            color: '#555555',
            lineHeight: 1.7,
          }}
        >
          Մադբեյզ էլեկտրոնային համակարգի թվային գործիքների միջոցով շինարարության ոլորտում տնտեսական գործունեություն իրականացնող կազմակերպությունները հնարավորություն են ստանում{' '}
          <Box component="span" sx={{ color: '#00A390', fontWeight: 600 }}>
            հաշվարկել, գնահատել և վերլուծել
          </Box>
          ,{' '}
          շինարարական ծրագրերի իրականացման արժեքը
        </Typography>
      </Box>
    </Box>
  );
}
