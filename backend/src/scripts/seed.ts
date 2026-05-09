import "dotenv/config";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { connectDb } from "../db";
import { Company, Product, User } from "../models";

const PASSWORD = "password123";

async function main(): Promise<void> {
  await connectDb();

  await User.deleteMany({});
  await Product.deleteMany({});
  await Company.deleteMany({});

  const clinicaRigatti = await Company.create({ name: "Clínica Rigatti" });
  const clinicaVolkart = await Company.create({ name: "Clínica Volkart" });

  const hash = await bcrypt.hash(PASSWORD, 10);

  await User.insertMany([
    {
      company_id: clinicaRigatti._id,
      email: "admin@clinicarigatti.fit",
      passwordHash: hash,
      role: "admin",
    },
    {
      company_id: clinicaRigatti._id,
      email: "equipe@clinicarigatti.fit",
      passwordHash: hash,
      role: "user",
    },
    {
      company_id: clinicaVolkart._id,
      email: "admin@clinicavolkart.fit",
      passwordHash: hash,
      role: "admin",
    },
    {
      company_id: clinicaVolkart._id,
      email: "equipe@clinicavolkart.fit",
      passwordHash: hash,
      role: "user",
    },
  ]);

  const baseImg =
    "https://clinicarigatti.s3.sa-east-1.amazonaws.com/imagens-site-v3/servicos";
  const rigattiImg = {
    reposicao: `${baseImg}/reposicao-hormonal-colorida.webp`,
    nutricao: `${baseImg}/nutricao-clinica-e-estetica-colorida.webp`,
    saudeFeminina: `${baseImg}/saude-feminina-e-longevidade-colorida.webp`,
    soroterapia: `${baseImg}/soroterapia-colorida.webp`,
    emagrecimento: `${baseImg}/emagrecimento-com-acompanhamento-colorida.webp`,
    modulacao: `${baseImg}/modulacao-hormonal-e-desempenho-colorida.png`,
  } as const;
  const defaultImage = rigattiImg.saudeFeminina;

  /** Inseridos primeiro: no dashboard (ordenado por createdAt desc) aparecem depois. */
  const rigattiPrograms = [
    {
      company_id: clinicaRigatti._id,
      name: "Check-up Metabólico Avançado",
      category: "Programas",
      description:
        "Avaliação completa com exames detalhados para mapear metabolismo, hormônios e inflamações, criando um plano de saúde altamente personalizado.",
      price: 1200,
      imageUrl: rigattiImg.reposicao,
    },
    {
      company_id: clinicaRigatti._id,
      name: "Programa de Saúde Intestinal",
      category: "Programas",
      description:
        "Protocolo focado na recuperação da microbiota intestinal, melhorando digestão, imunidade e auxiliando no emagrecimento.",
      price: 650,
      imageUrl: rigattiImg.nutricao,
    },
    {
      company_id: clinicaRigatti._id,
      name: "Terapia do Sono",
      category: "Programas",
      description:
        "Programa especializado para regular o sono, equilibrar hormônios e melhorar energia, foco e recuperação do organismo.",
      price: 500,
      imageUrl: rigattiImg.soroterapia,
    },
    {
      company_id: clinicaRigatti._id,
      name: "Performance Masculina",
      category: "Programas",
      description:
        "Tratamento voltado para aumento de energia, libido e desempenho físico através de ajustes hormonais e hábitos estratégicos.",
      price: 900,
      imageUrl: rigattiImg.modulacao,
    },
    {
      company_id: clinicaRigatti._id,
      name: "Estética Regenerativa",
      category: "Programas",
      description:
        "Protocolos avançados para rejuvenescimento da pele e cabelo, estimulando a regeneração natural do corpo.",
      price: 800,
      imageUrl: rigattiImg.saudeFeminina,
    },
    {
      company_id: clinicaRigatti._id,
      name: "Recuperação Pós-Bariátrica",
      category: "Programas",
      description:
        "Acompanhamento completo com reposição de nutrientes e ajustes metabólicos para otimizar a recuperação após cirurgia bariátrica.",
      price: 700,
      imageUrl: rigattiImg.emagrecimento,
    },
    {
      company_id: clinicaRigatti._id,
      name: "Plano de Acompanhamento Contínuo",
      category: "Programas",
      description:
        "Assinatura mensal com consultas, ajustes de protocolos e monitoramento constante para manter resultados a longo prazo.",
      price: 350,
      imageUrl: rigattiImg.reposicao,
    },
  ];

  /** Inseridos por último na Rigatti: aparecem primeiro no dashboard — um asset visual por linha. */
  const rigattiServices = [
    {
      company_id: clinicaRigatti._id,
      name: "Reposição hormonal",
      category: "Serviços",
      description:
        "Recupere sua energia, libido e foco com protocolos hormonais seguros e personalizados. Resultado: mais disposição, equilíbrio e autoconfiança.",
      price: 890,
      imageUrl: rigattiImg.reposicao,
    },
    {
      company_id: clinicaRigatti._id,
      name: "Nutrição Clínica e Estética",
      category: "Serviços",
      description:
        "Planos nutricionais individualizados que aceleram resultados, reduzem inflamações e favorecem a estética corporal.",
      price: 450,
      imageUrl: rigattiImg.nutricao,
    },
    {
      company_id: clinicaRigatti._id,
      name: "Saúde Feminina e Longevidade",
      category: "Serviços",
      description:
        "Tratamentos integrados que equilibram hormônios, reduzem sintomas da menopausa e promovem longevidade com vitalidade.",
      price: 720,
      imageUrl: rigattiImg.saudeFeminina,
    },
    {
      company_id: clinicaRigatti._id,
      name: "Soroterapia",
      category: "Serviços",
      description:
        "Infusões intravenosas com vitaminas e minerais para restaurar vitalidade e imunidade. Ideal para quem sente fadiga, estresse ou baixa imunidade.",
      price: 380,
      imageUrl: rigattiImg.soroterapia,
    },
    {
      company_id: clinicaRigatti._id,
      name: "Emagrecimento com Acompanhamento Médico",
      category: "Serviços",
      description:
        "Elimine o peso de forma definitiva com monitoramento médico e protocolos hormonais personalizados.",
      price: 1290,
      imageUrl: rigattiImg.emagrecimento,
    },
    {
      company_id: clinicaRigatti._id,
      name: "Modulação Hormonal e Desempenho",
      category: "Serviços",
      description:
        "Otimização hormonal e metabólica para quem busca alta performance física e mental.",
      price: 950,
      imageUrl: rigattiImg.modulacao,
    },
  ];

  await Product.insertMany(rigattiPrograms);
  await Product.insertMany(rigattiServices);

  await Product.insertMany([
    {
      company_id: clinicaVolkart._id,
      name: "Plano Antifadiga Integrado",
      category: "Protocolos",
      description:
        "Protocolo clínico com foco em energia sustentada, correção nutricional e redução de cansaço crônico para rotina de alta demanda.",
      price: 690,
      imageUrl: 'https://healthcare.utah.edu/sites/g/files/zrelqx136/files/styles/billboard_desktop/public/media/images/2024/GettyImages-866130634-exercise%20breathing.jpg?h=499ddffa&itok=I8SJJOPE',
    },
    {
      company_id: clinicaVolkart._id,
      name: "Detox Hepático Funcional",
      category: "Protocolos",
      description:
        "Estratégia terapêutica para suporte hepático, melhora de marcadores inflamatórios e maior eficiência metabólica.",
      price: 740,
      imageUrl: defaultImage,
    },
    {
      company_id: clinicaVolkart._id,
      name: "Controle de Resistência Insulínica",
      category: "Protocolos",
      description:
        "Acompanhamento médico e nutricional para estabilizar glicemia, reduzir picos de fome e acelerar recomposição corporal.",
      price: 980,
      imageUrl: 'https://thumbs.dreamstime.com/b/insulina-37133481.jpg',
    },
    {
      company_id: clinicaVolkart._id,
      name: "Programa de Equilíbrio Hormonal Feminino",
      category: "Protocolos",
      description:
        "Plano direcionado para sintomas de TPM, perimenopausa e menopausa com abordagem clínica individualizada.",
      price: 860,
      imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcThAM_jtDVXlRoG1hp9Ol_T-t7dRk14gWD4uQ&s',
    },
    {
      company_id: clinicaVolkart._id,
      name: "Protocolo de Imunidade Estratégica",
      category: "Protocolos",
      description:
        "Combinação de micronutrientes, ajustes de estilo de vida e monitoramento laboratorial para fortalecer defesa imunológica.",
      price: 620,
      imageUrl: 'https://cdn.prod.website-files.com/624adfce4249ed51840ef8d1/62c48a76c7568a1ebfb32033_IMUNIDADE-3gJr00fjl9.jpeg',
    },
    {
      company_id: clinicaVolkart._id,
      name: "Nutrição para Alta Performance Cognitiva",
      category: "Protocolos",
      description:
        "Intervenções nutricionais e metabólicas para foco, memória e clareza mental em profissionais de alta exigência.",
      price: 790,
      imageUrl: 'https://uploads.metroimg.com/wp-content/uploads/2025/05/09171849/concentracao-xadrez.jpg',
    },
    {
      company_id: clinicaVolkart._id,
      name: "Reabilitação Metabólica Pós-Covid",
      category: "Protocolos",
      description:
        "Acompanhamento para recuperar vitalidade, melhorar condicionamento e corrigir disfunções metabólicas pós-infecção.",
      price: 830,
      imageUrl: 'https://www.formularium.com.br/inform/wp-content/uploads/2021/10/O-atendimento-medico-e-essencial-para-tratar-a-Sindrome-Pos-COVID.jpg',
    },
    {
      company_id: clinicaVolkart._id,
      name: "Protocolo de Redução de Inflamação Sistêmica",
      category: "Protocolos",
      description:
        "Plano clínico para reduzir dores, edema e inflamações persistentes com base em dados laboratoriais e ajuste contínuo.",
      price: 920,
      imageUrl: 'https://img1.wsimg.com/isteam/ip/d9ac8c79-9a5e-4057-8b75-62ea1825f0d7/intradermoterapia-0006.jpg/:/',
    },
    {
      company_id: clinicaVolkart._id,
      name: "Programa de Saúde da Tireoide",
      category: "Protocolos",
      description:
        "Avaliação e acompanhamento para otimizar função tireoidiana, regular metabolismo e melhorar qualidade de vida.",
      price: 870,
      imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTWfKtu7op28Mdbabnf9J1NbejY_8yKiAy51Q&s',
    },
    {
      company_id: clinicaVolkart._id,
      name: "Acompanhamento de Composição Corporal",
      category: "Protocolos",
      description:
        "Monitoramento mensal de massa magra e gordura com metas progressivas para ganho de saúde e estética.",
      price: 560,
      imageUrl: 'https://www.drfredcartaxo.com.br/wp-content/uploads/2024/01/Composicao-corporal-o-que-revela-o-exame-de-adipometria-1.jpg',
    },
    {
      company_id: clinicaVolkart._id,
      name: "Programa de Longevidade Ativa",
      category: "Protocolos",
      description:
        "Plano contínuo com prevenção, ajuste hormonal e cuidado metabólico para envelhecimento saudável com autonomia.",
      price: 1100,
      imageUrl: 'https://www.sesc-rs.com.br/wp-content/uploads/2024/07/atividades-matu-total.jpg',
    },
  ]);

  console.log("");
  console.log("=== Seed concluído com sucesso ===");
  console.log("");
  console.log("  Clínica Rigatti");
  console.log(`    company_id:      ${String(clinicaRigatti._id)}`);
  console.log("    Usuário admin:   admin@clinicarigatti.fit");
  console.log("    Usuário equipe:  equipe@clinicarigatti.fit");
  console.log(`    Senha:           ${PASSWORD}`);

  console.log("");
  console.log("  Clínica Volkart");
  console.log(`    company_id:      ${String(clinicaVolkart._id)}`);
  console.log("    Usuário admin:   admin@clinicavolkart.fit");
  console.log("    Usuário equipe:  equipe@clinicavolkart.fit");
  console.log(`    Senha:           ${PASSWORD}`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
