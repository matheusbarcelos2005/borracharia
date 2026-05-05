// Catálogo de serviços PneuPro
const produtos = [

  // ── Pneus — Veículos Leves ─────────────────────────────────────────────────
  { id: 1,  nome: "Troca de Pneu de Carro",          categoria: "Pneus Leves",       icone: "fa-solid fa-car",            destaque: true  },
  { id: 2,  nome: "Conserto de Pneu (Remendo)",       categoria: "Pneus Leves",       icone: "fa-solid fa-wrench"                          },
  { id: 3,  nome: "Borracharia de Moto",              categoria: "Pneus Leves",       icone: "fa-solid fa-motorcycle",     destaque: true  },
  { id: 4,  nome: "Vulcanização a Quente",            categoria: "Pneus Leves",       icone: "fa-solid fa-fire"                            },
  { id: 5,  nome: "Nitrogenização de Pneus",          categoria: "Pneus Leves",       icone: "fa-solid fa-wind"                            },
  { id: 6,  nome: "Venda de Pneus Novos — Leves",     categoria: "Pneus Leves",       icone: "fa-solid fa-store"                           },

  // ── Frotas e Veículos Pesados ──────────────────────────────────────────────
  { id: 7,  nome: "Troca de Pneu de Caminhão",        categoria: "Frotas e Pesados",  icone: "fa-solid fa-truck",          destaque: true  },
  { id: 8,  nome: "Recapagem de Pneu",                categoria: "Frotas e Pesados",  icone: "fa-solid fa-rotate"                          },
  { id: 9,  nome: "Atendimento a Frotas",             categoria: "Frotas e Pesados",  icone: "fa-solid fa-truck-ramp-box", destaque: true  },
  { id: 10, nome: "Pneu de Ônibus e Micro-ônibus",    categoria: "Frotas e Pesados",  icone: "fa-solid fa-bus"                             },
  { id: 11, nome: "Pneu Agrícola e de Trator",        categoria: "Frotas e Pesados",  icone: "fa-solid fa-tractor"                         },
  { id: 12, nome: "Venda de Pneus — Pesados",         categoria: "Frotas e Pesados",  icone: "fa-solid fa-boxes-stacked"                   },

  // ── Emergência 24h ─────────────────────────────────────────────────────────
  { id: 13, nome: "Socorro em Estrada",               categoria: "Emergência 24h",    icone: "fa-solid fa-road",           destaque: true  },
  { id: 14, nome: "Troca de Pneu Noturna",            categoria: "Emergência 24h",    icone: "fa-solid fa-moon"                            },
  { id: 15, nome: "Atendimento Emergencial",          categoria: "Emergência 24h",    icone: "fa-solid fa-bell-concierge", destaque: true  },
  { id: 16, nome: "Plantão de Borracharia",           categoria: "Emergência 24h",    icone: "fa-solid fa-phone-volume"                    },
  { id: 17, nome: "Resgate de Veículo na Estrada",    categoria: "Emergência 24h",    icone: "fa-solid fa-truck-medical"                   },

  // ── Outros Serviços ───────────────────────────────────────────────────────
  { id: 18, nome: "Calibração de Pneus",              categoria: "Outros Serviços",   icone: "fa-solid fa-gauge"                           },
  { id: 19, nome: "Alinhamento de Direção",           categoria: "Outros Serviços",   icone: "fa-solid fa-ruler-horizontal"                },
  { id: 20, nome: "Balanceamento de Rodas",           categoria: "Outros Serviços",   icone: "fa-solid fa-rotate-right", destaque: true   },
  { id: 21, nome: "Rodas e Aros",                     categoria: "Outros Serviços",   icone: "fa-solid fa-circle-dot"                      },
  { id: 22, nome: "Troca de Parafusos e Porcas",      categoria: "Outros Serviços",   icone: "fa-solid fa-screwdriver"                     },
];

// Atribui número sequencial
produtos.forEach((p, i) => { p.numero = i + 1; p.preco = 0; });
