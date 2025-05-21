export interface Database {
  public: {
    Tables: {
      prompts: {
        Row: {
          id: string;
          title: string;
          description: string;
          category: string;
          command: string;
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          category: string;
          command: string;
          created_at?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          category?: string;
          command?: string;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
        };
      };
    };
  };
}