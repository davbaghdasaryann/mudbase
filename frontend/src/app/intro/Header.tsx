import { AppBar, Box, Button, Toolbar } from "@mui/material";
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import EastIcon from '@mui/icons-material/East';



export default function Header() {

    const scrollToId = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
        }
    };
    const router = useRouter();
    return (
        <AppBar position="sticky" color="transparent" elevation={0} sx={{ background: 'transparent' }}>
            <Toolbar sx={{ justifyContent: 'space-between' }}>

                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Image src="/images/mudbase_header_title.svg" alt="Mudbase" width={140} height={48} />
                </Box>


                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {/* Internal Navigation buttons */}
                    <Button onClick={() => scrollToId('barev')} size="large" sx={{ color: '#333', textTransform: 'none' }}>
                        Գլխավոր
                    </Button>
                    <Button onClick={() => scrollToId('about')} size="large" sx={{ color: '#333', textTransform: 'none' }}>
                        Ինչ է Մադբեյզը
                    </Button>
                    <Button onClick={() => scrollToId('contact')} size="large" sx={{ color: '#333', textTransform: 'none' }}>
                        Կապ մեզ հետ
                    </Button>


                    <Button
                        onClick={() => { router.push('/login') }}
                        size="large"
                        sx={{
                            color: '#00ABBE',
                            textTransform: 'none',
                            borderStyle: 'solid',
                            borderColor: '#00ABBE',
                            borderWidth: 0.5,
                            borderRadius: 2,
                            '&:hover': {
                                color: '#00A390',
                                borderColor: '#00A390',
                            }
                        }}
                    >
                        Մուտք գործել
                    </Button>
                    <Button
                        onClick={() => { router.push('/signup') }}
                        size="large"
                        sx={{
                            bgcolor: '#00ABBE', color: '#F5F9F9', textTransform: 'none', '&:hover': {
                                bgcolor: '#00A390',
                            },
                        }}

                        endIcon={<EastIcon />}

                    >
                        Գրանցվել
                    </Button>
                </Box>
            </Toolbar>
        </AppBar>
    );
}
