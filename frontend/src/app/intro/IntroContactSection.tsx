import Image from 'next/image';
import { Box, Typography } from '@mui/material';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';

export default function ContactSection() {
  return (
    <Box
      component="section"
      sx={{
        background: 'linear-gradient(180deg, #FFFFFF 0%, #E3F7F5 100%)',
        py: { xs: 6, md: 12 },
        px: { xs: 2, md: 8 },
      }}
    >
      <Box
        sx={{
          maxWidth: 1200,
          mx: 'auto',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: 'center',
          gap: { xs: 6, md: 8 },
        }}
      >
        <Box sx={{ flex: '1 1 50%' }}>
          <Typography
            variant="h4"
            component="h2"
            gutterBottom
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(90deg, #00A390 0%, #007D65 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Կապ մեզ հետ
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Box
              component="a"
              href="tel:+37491570800"
              sx={{ color: '#00A390', mr: 1, display: 'flex' }}
            >
              <PhoneIcon />
            </Box>
            <Typography
              component="a"
              href="tel:+37491570800"
              sx={{
                color: '#282828',
                textDecoration: 'none',
                userSelect: 'text',
              }}
            >
              +374 91 570 800
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Box
              component="a"
              href="mailto:info@mudbase.am"
              sx={{ color: '#00A390', mr: 1, display: 'flex' }}
            >
              <EmailIcon />
            </Box>
            <Typography
              component="a"
              href="mailto:info@mudbase.am"
              sx={{
                color: '#282828',
                textDecoration: 'none',
                userSelect: 'text',
              }}
            >
              info@mudbase.am
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box
              component="a"
              href="https://www.google.com/maps/place/Instax+Yerevan+Films+-+%D0%A4%D0%BE%D1%82%D0%BE%D0%BA%D0%B0%D1%80%D1%82%D0%BE%D1%87%D0%BA%D0%B8+%D0%B8+%D0%9A%D0%B0%D0%BC%D0%B5%D1%80%D1%8B+Instax/@40.1619818,44.5117673,17z/data=!4m14!1m7!3m6!1s0x406abd4d853dc57b:0xe8065fe3bdb68983!2zSW5zdGF4IFllcmV2YW4gRmlsbXMgLSDQpNC-0YLQvtC60LDRgNGC0L7Rh9C60Lgg0Lgg0JrQsNC80LXRgNGLIEluc3RheA!8m2!3d40.1619818!4d44.5117673!16s%2Fg%2F11jz_mnqjq!3m5!1s0x406abd4d853dc57b:0xe8065fe3bdb68983!8m2!3d40.1619818!4d44.5117673!16s%2Fg%2F11jz_mnqjq?entry=ttu&g_ep=EgoyMDI1MDYyMi4wIKXMDSoASAFQAw%3D%3D"
              target="_blank"
              rel="noopener noreferrer"
              sx={{ color: '#00A390', mr: 1, display: 'flex' }}
            >
              <LocationOnIcon />
            </Box>
            <Typography
              component="a"
              href="https://www.google.com/maps/place/Instax+Yerevan+Films+-+%D0%A4%D0%BE%D1%82%D0%BE%D0%BA%D0%B0%D1%80%D1%82%D0%BE%D1%87%D0%BA%D0%B8+%D0%B8+%D0%9A%D0%B0%D0%BC%D0%B5%D1%80%D1%8B+Instax/@40.1619818,44.5117673,17z/data=!4m14!1m7!3m6!1s0x406abd4d853dc57b:0xe8065fe3bdb68983!2zSW5zdGF4IFllcmV2YW4gRmlsbXMgLSDQpNC-0YLQvtC60LDRgNGC0L7Rh9C60Lgg0Lgg0JrQsNC80LXRgNGLIEluc3RheA!8m2!3d40.1619818!4d44.5117673!16s%2Fg%2F11jz_mnqjq!3m5!1s0x406abd4d853dc57b:0xe8065fe3bdb68983!8m2!3d40.1619818!4d44.5117673!16s%2Fg%2F11jz_mnqjq?entry=ttu&g_ep=EgoyMDI1MDYyMi4wIKXMDSoASAFQAw%3D%3D"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: '#282828',
                textDecoration: 'none',
                userSelect: 'text',
              }}
            >
              ք. Երևան, Տիգրան Մեծ 60-43
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            flex: '1 1 50%',
            display: 'flex',
            justifyContent: { xs: 'center', md: 'flex-end' },
          }}
        >
          <Image
            src="/images/intro/contact.svg"
            alt="Contact illustration with social icons"
            width={600}
            height={400}
            style={{ objectFit: 'contain' }}
          />
        </Box>
      </Box>
    </Box>
  );
}
