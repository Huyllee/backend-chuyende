interface Novel {
    title: string;
    author: string;
    artist: string;
    description: string;
    cover_image: string;
    categories_id: number[];
  }

  interface ResultSetHeader {
    fieldCount: number;
    affectedRows: number;
    insertId: number;
    info: string;
    serverStatus: number;
    warningStatus: number;
  }