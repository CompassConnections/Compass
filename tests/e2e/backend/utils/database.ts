class DatabaseTestingUtilities {
    findUserByName = async (page: any, name: string) => {
        const queryUserById = `
            SELECT p.*
            FROM public.users AS p
            WHERE name = $1
        `;
        const userResults = await page.db.query(queryUserById,[name])
        return userResults[0]
    };
    
    findProfileById = async (page: any, user_id: string) => {
        const queryProfileById = `
            SELECT 
                p.*,
                TO_CHAR(p.created_time, 'Mon DD, YYYY HH12:MI AM') as created_date,
                TO_CHAR(p.last_modification_time, 'Mon DD, YYYY HH12:MI AM') as modified_date
            FROM public.profiles AS p
            WHERE user_id = $1
        `;
        const profileResults = await page.db.query(queryProfileById,[user_id])
        return profileResults[0]
    };

};

export const databaseUtils = new DatabaseTestingUtilities();