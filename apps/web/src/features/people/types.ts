export type Sex = "MALE" | "FEMALE";

export type Person = {
  id: string;
  organizationId: string;
  name: string;
  sex: Sex;
  active: boolean;
  young: boolean;
  batizado: boolean;
  limpeza: boolean;
  estudante: boolean;
  privilegioServico: boolean;

  chefeFamilia: boolean;
  casada: boolean;
  familyId: string | null;

  iniciarConversas: boolean;
  cultivarInteresse: boolean;
  fazerDiscipulos: boolean;
  explicarCrencas: boolean;

  leituraBiblia: boolean;
  microfoneVolante: boolean;
  som: boolean;
  video: boolean;
  palco: boolean;

  leitorEstudoBiblico: boolean;
  leitorSentinela: boolean;
  indicador: boolean;
  oracao: boolean;

  anciao: boolean;
  presidenteVidaMinisterio: boolean;
  discursoTesouros: boolean;
  joiasEspirituais: boolean;
  nossaVidaCrista: boolean;
  necessidadesLocais: boolean;
  condutorEstudoBiblico: boolean;
  presidenteFimSemana: boolean;
  discursoPublico: boolean;
  condutorSentinela: boolean;

  userId: string | null;
  family: { id: string; name: string } | null;
  user: { id: string; name: string; email: string } | null;
};

export type Family = {
  id: string;
  name: string;
};

export type MemberUser = {
  id: string;
  name: string;
  email: string;
};

export type PeopleStats = {
  total: number;
  active: number;
  families: number;
  men: number;
  women: number;
  servicePrivilege: number;
};
