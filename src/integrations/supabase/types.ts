export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          ativo: boolean
          created_at: string
          nome: string | null
          role: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          nome?: string | null
          role?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          nome?: string | null
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      categorias: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          nome: string
          ordem: number
          slug: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome: string
          ordem?: number
          slug: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
          ordem?: number
          slug?: string
        }
        Relationships: []
      }
      clientes: {
        Row: {
          created_at: string
          id: string
          nome: string
          telefone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          telefone: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          telefone?: string
          updated_at?: string
        }
        Relationships: []
      }
      configuracoes_loja: {
        Row: {
          aceita_pedidos: boolean
          atualizado_em: string
          endereco_loja: string
          horario_abertura: string
          horario_fechamento: string
          id: boolean
          logo_url: string | null
          nome: string
          pedido_minimo: number
          slogan: string
          taxa_entrega: number
          whatsapp: string
        }
        Insert: {
          aceita_pedidos?: boolean
          atualizado_em?: string
          endereco_loja?: string
          horario_abertura?: string
          horario_fechamento?: string
          id?: boolean
          logo_url?: string | null
          nome?: string
          pedido_minimo?: number
          slogan?: string
          taxa_entrega?: number
          whatsapp?: string
        }
        Update: {
          aceita_pedidos?: boolean
          atualizado_em?: string
          endereco_loja?: string
          horario_abertura?: string
          horario_fechamento?: string
          id?: boolean
          logo_url?: string | null
          nome?: string
          pedido_minimo?: number
          slogan?: string
          taxa_entrega?: number
          whatsapp?: string
        }
        Relationships: []
      }
      enderecos: {
        Row: {
          bairro: string | null
          cep: string | null
          cliente_id: string | null
          complemento: string | null
          created_at: string
          id: string
          numero: string | null
          referencia: string | null
          rua: string | null
        }
        Insert: {
          bairro?: string | null
          cep?: string | null
          cliente_id?: string | null
          complemento?: string | null
          created_at?: string
          id?: string
          numero?: string | null
          referencia?: string | null
          rua?: string | null
        }
        Update: {
          bairro?: string | null
          cep?: string | null
          cliente_id?: string | null
          complemento?: string | null
          created_at?: string
          id?: string
          numero?: string | null
          referencia?: string | null
          rua?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enderecos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      formas_pagamento: {
        Row: {
          ativo: boolean
          descricao: string
          id: string
          nome: string
          ordem: number
        }
        Insert: {
          ativo?: boolean
          descricao?: string
          id?: string
          nome: string
          ordem?: number
        }
        Update: {
          ativo?: boolean
          descricao?: string
          id?: string
          nome?: string
          ordem?: number
        }
        Relationships: []
      }
      pedido_itens: {
        Row: {
          id: string
          nome_produto: string
          pedido_id: string
          preco_unitario: number
          produto_id: string | null
          quantidade: number
          total: number
        }
        Insert: {
          id?: string
          nome_produto: string
          pedido_id: string
          preco_unitario: number
          produto_id?: string | null
          quantidade: number
          total: number
        }
        Update: {
          id?: string
          nome_produto?: string
          pedido_id?: string
          preco_unitario?: number
          produto_id?: string | null
          quantidade?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "pedido_itens_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_itens_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos: {
        Row: {
          atualizado_em: string
          cliente_id: string | null
          criado_em: string
          endereco: Json
          id: string
          nome_cliente: string
          numero: string
          observacao: string
          pagamento: string
          pagamento_status: string
          status: string
          subtotal: number
          taxa_entrega: number
          telefone: string
          tipo_entrega: string
          total: number
        }
        Insert: {
          atualizado_em?: string
          cliente_id?: string | null
          criado_em?: string
          endereco?: Json
          id?: string
          nome_cliente: string
          numero: string
          observacao?: string
          pagamento: string
          pagamento_status?: string
          status?: string
          subtotal?: number
          taxa_entrega?: number
          telefone: string
          tipo_entrega: string
          total?: number
        }
        Update: {
          atualizado_em?: string
          cliente_id?: string | null
          criado_em?: string
          endereco?: Json
          id?: string
          nome_cliente?: string
          numero?: string
          observacao?: string
          pagamento?: string
          pagamento_status?: string
          status?: string
          subtotal?: number
          taxa_entrega?: number
          telefone?: string
          tipo_entrega?: string
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          ativo: boolean
          categoria_id: string | null
          created_at: string
          descricao: string
          destaque: boolean
          id: string
          imagem_url: string | null
          nome: string
          ordem: number
          preco: number
          selo: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          categoria_id?: string | null
          created_at?: string
          descricao?: string
          destaque?: boolean
          id?: string
          imagem_url?: string | null
          nome: string
          ordem?: number
          preco: number
          selo?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          categoria_id?: string | null
          created_at?: string
          descricao?: string
          destaque?: boolean
          id?: string
          imagem_url?: string | null
          nome?: string
          ordem?: number
          preco?: number
          selo?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "produtos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      criar_pedido: {
        Args: {
          p_endereco: Json
          p_itens: Json
          p_nome: string
          p_observacao: string
          p_pagamento: string
          p_telefone: string
          p_tipo_entrega: string
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
