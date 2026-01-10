import { Box, Link, Typography } from '@mui/material';
import { PageContentsProps } from '../PageContents';
import { useTranslation } from 'react-i18next';
import ImgElement from '@/tsui/DomElements/ImgElement';
import { facebookUrl, instagramUrl, telegramUrl } from '@/theme';

export default function AppFooterCopyrightNotice(
    props: PageContentsProps
) {
    const { t } = useTranslation();

    return (
        <Box
            component="footer"
            sx={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                width: '100%',
                py: 2,
                px: 2,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
            }}
        >
            <Typography variant="body2">
                {t('page.copyright')}
            </Typography>

            <Box
                sx={{
                    position: 'absolute',
                    right: 18,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    display: 'flex',
                    gap: 1.5,
                    alignItems: 'center',
                }}
            >
                <Link
                    href={facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    underline="none"
                >
                    <ImgElement
                        src="/images/icons/facebook_public_page.svg"
                        sx={{ height: 25 }}
                    />
                </Link>

                <Link
                    href={telegramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    underline="none"
                >
                    <ImgElement
                        src="/images/icons/telegram_public_page.svg"
                        sx={{ height: 25 }}
                    />
                </Link>

                <Link
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    underline="none"
                >
                    <ImgElement
                        src="/images/icons/instagram_public_page.svg"
                        sx={{ height: 25 }}
                    />
                </Link>
            </Box>
        </Box>
    );
}
