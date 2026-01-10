// components/VideoSection.tsx
import Image from 'next/image';
import { Box, Typography } from '@mui/material';

interface VideoSectionProps {
  youtubeUrl: string;
}

export default function VideoSection({ youtubeUrl }: VideoSectionProps) {
  return (
    <Box id='barev'
      component="section"
      sx={{
     bgcolor:  '#F5F9F9',
        py: { xs: 4, md: 10 },
        px: { xs: 2, md: 0 },    
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: 'center',
          gap: { xs: 4, md: 8 },   
          maxWidth: 1200,         
          mx: 'auto',             
        }}
      >
        <Box
          sx={{
            flex: '0 0 50%',
            maxWidth: 500,
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <Image
            src="/images/intro/Online-amico-1.svg"
            alt="Illustration"
            width={500}
            height={400}
            style={{ objectFit: 'contain' }}
          />
        </Box>

        <Box
          sx={{
            flex: '0 0 50%',
            maxWidth: 400,
            width: '100%',
            textAlign: { xs: 'center', md: 'center' },
          }}
        >
          <Typography
            variant="h4"
            component="h2"
            gutterBottom
            sx={{ fontWeight: 700, color: '#282828' }}
          >
            Իմացիր ավելին
          </Typography>
          <Box
            component="a"
            href={youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ display: 'inline-block', cursor: 'pointer' }}
          >
            <Image
              src="/images/intro/Youtube-link.svg"
              alt="YouTube link"
              width={80}
              height={80}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
