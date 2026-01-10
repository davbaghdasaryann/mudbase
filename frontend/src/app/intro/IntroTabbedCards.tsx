// components/TabbedCards.tsx
import { useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import ConstructionIcon from '@mui/icons-material/Construction';
import DesignServicesIcon from '@mui/icons-material/DesignServices';
import DomainIcon from '@mui/icons-material/Domain';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';

interface TitlePart {
  text: string;
  highlight?: boolean;
}

interface CardItem {
  number: string;
  titleParts: TitlePart[];
  accentColor: string;
  filled: boolean;
}

interface Tab {
  id: string;
  label: string;
  title: string;
  icon: React.ElementType;
  cards: CardItem[];
}

const tabs: Tab[] = [
  {
    id: 'construction',
    label: 'Շինարարություն',
    title: 'Շինարարություն',
    icon: ConstructionIcon,
    cards: [
      {
        number: '1',
        accentColor: '#00A390',
        filled: true,
        titleParts: [
          { text: 'Շինարարական աշխատանքների նախահաշվի առնվազն ' },
          { text: 'երեք անգամ ավելի արագ', highlight: true },
          { text: ' հաշվարկ' },
        ],
      },
      {
        number: '2',
        accentColor: '#00A390',
        filled: true,
        titleParts: [
          { text: 'Աշխատանքների և նյութերի վերաբերյալ տվյալների շտեմարանների ' },
          { text: 'պարբերաբար թարմացումներ', highlight: true },
        ],
      },
      {
        number: '3',
        accentColor: '#0F3947',
        filled: false,
        titleParts: [
          { text: 'Համակարգված և ' },
          { text: 'ճշգրիտ', highlight: true },
          { text: ' նախահաշվի կազմում' },
        ],
      },
      {
        number: '4',
        accentColor: '#0F3947',
        filled: false,
        titleParts: [
          { text: 'Առաջարկվող գնի ' },
          { text: 'մրցակցային կարողությունների', highlight: true },
          { text: ' գնահատում' },
        ],
      },
    ],
  },
  {
    id: 'projects',
    label: 'Նախագծերի կառավարում',
    title: 'Նախագծերի կառավարում',
    icon: DesignServicesIcon,
    cards: [
      {
        number: '1',
        accentColor: '#00A390',
        filled: true,
        titleParts: [
          { text: 'Շինարարական ծրագրերի միջին շուկայական արժեքի նախնական հաշվարկ' }
        ],
      },
      {
        number: '2',
        accentColor: '#00A390',
        filled: true,
        titleParts: [
          { text: 'Հաշվարկի արդյունքների արագ գեներացում' }
        ],
      },
      {
        number: '3',
        accentColor: '#0F3947',
        filled: false,
        titleParts: [
          { text: 'Այլ կազմակերպությունների հետ արագ փոխգործակցության հնարավորություն' }
        ],
      },
      {
        number: '4',
        accentColor: '#0F3947',
        filled: false,
        titleParts: [
          { text: 'Շինարարության արժեքների վերաբերյալ կազմակերպություններից արագ հարցումների հնարավորություն' }
        ],
      },
    ],
  },
  {
    id: 'large',
    label: 'Խոշոր կառուցապատում',
    title: 'Խոշոր կառուցապատում',
    icon: DomainIcon,
    cards: [
      {
        number: '1',
        accentColor: '#00A390',
        filled: true,
        titleParts: [
          { text: 'Ֆինանսական միջոցների խնայում և չնախատեսված ծախսերի ռիսկերի կառավարում' }
        ],
      },
      {
        number: '2',
        accentColor: '#00A390',
        filled: true,
        titleParts: [
          { text: 'Շինարարական աշխատանքների արժեքների շուկայական մոնիտորինգի իրականացման համար թվային գործիքներ' }
        ],
      },
      {
        number: '3',
        accentColor: '#0F3947',
        filled: false,
        titleParts: [
          { text: 'Շինարարական ծրագրերի վերլուծության իրականացման գործիքներ' }
        ],
      },
      {
        number: '4',
        accentColor: '#0F3947',
        filled: false,
        titleParts: [
          { text: 'Աշխատանքների արժեքների վերաբերյալ արագ հարցումների հնարավորություն' }
        ],
      },
    ],
  },
  {
    id: 'finance',
    label: 'Ֆինանսական կառավարում',
    title: 'Ֆինանսական կառավարում',
    icon: AttachMoneyIcon,
    cards: [
      {
        number: '1',
        accentColor: '#00A390',
        filled: true,
        titleParts: [
          { text: 'Շինարարական աշխատանքների և նյութերի վերաբերյալ պարբերաբար թարմացվող տեղեկատվական շտեմարաններ' }
        ],
      },
      {
        number: '2',
        accentColor: '#00A390',
        filled: true,
        titleParts: [
          { text: 'Շինարարական ծրագրերի միջին շուկայական արժեքի գնահատում և վերլուծություն' }
        ],
      },
      {
        number: '3',
        accentColor: '#0F3947',
        filled: false,
        titleParts: [
          { text: 'Համակարգի օգտատեր հանդիսացող կազմակերպություններից արագ հարցումներ կատարելու հնարավորություն' }
        ],
      },
      {
        number: '4',
        accentColor: '#0F3947',
        filled: false,
        titleParts: [
          { text: 'Շինարարական ծրագրի նախահաշվի վերլուծության համար թվային վերլուծական գործիքներ' }
        ],
      },
    ],
  },
];

export default function TabbedCards() {
  const [activeTab, setActiveTab] = useState(0);
  const { title, icon: Icon, cards } = tabs[activeTab];

  const activeGrad = 'linear-gradient(90deg, #00A390 0%, #007D65 100%)';
  const inactiveGrad = 'linear-gradient(90deg, #D3D3D3 0%, #B5E5D6 100%)';

  return (
    <Box
      component="section"
      sx={{
        width: '100%',
        background: "linear-gradient(to bottom, #E7F7F0, #FAFAFA)",
        py: { xs: 6, md: 10 },
        px: { xs: 2, md: 8 },
      }}
    >
      <Box display="flex" justifyContent="center" alignItems="center" mb={6}>
        <Icon sx={{ fontSize: 32, color: '#00A390', mr: 1 }} />
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#282828' }}>
          {title}
        </Typography>
      </Box>

      <Box
        display="grid"
        gridTemplateColumns={{
          xs: '1fr',
          sm: '1fr 1fr',
          md: 'repeat(4, 1fr)',
        }}
        gap={4}
        mb={6}
      >
        {cards.map(({ number, titleParts, accentColor, filled }) => (
          <Box
            key={number}
            sx={{
              position: 'relative',
              p: 4,
              pt: 6,
              bgcolor: '#ffffff',
              borderRadius: 4,
              boxShadow: '0px 8px 16px rgba(0,0,0,0.08)',
              '&:before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                borderTop: `4px solid ${accentColor}`,
                borderLeft: `4px solid ${accentColor}`,
                borderRadius: '24px',
                boxSizing: 'border-box',
              },
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: -20,
                left: 20,
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                bgcolor: filled ? accentColor : '#ffffff',
                color: filled ? '#ffffff' : accentColor,
                border: filled ? 'none' : `2px solid ${accentColor}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '1.25rem',
              }}
            >
              {number}
            </Box>

            <Typography variant="body1" sx={{ lineHeight: 1.5 }}>
              {titleParts.map((part, idx) => (
                <Box
                  key={idx}
                  component="span"
                  sx={{
                    color: part.highlight ? accentColor : '#282828',
                    fontWeight: part.highlight ? 600 : 400,
                  }}
                >
                  {part.text}
                </Box>
              ))}
            </Typography>
          </Box>
        ))}
      </Box>

      <Box display="flex" justifyContent="center" flexWrap="wrap" gap={2}>
        {tabs.map((t, idx) => {
          const isActive = idx === activeTab;
          return (
            <Button
              key={t.id}
              startIcon={<t.icon sx={{ fontSize: 20, color: '#fff' }} />}
              onClick={() => setActiveTab(idx)}
              sx={{
                textTransform: 'none',
                borderRadius: 50,
                px: 4,
                py: 1.5,
                color: '#fff',
                background: isActive ? activeGrad : inactiveGrad,
                opacity: isActive ? 1 : 0.6,
                '&:hover': {
                  background: isActive ? activeGrad : inactiveGrad,
                  opacity: 1,
                },
              }}
            >
              {t.label}
            </Button>
          );
        })}
      </Box>
    </Box>
  );
}
