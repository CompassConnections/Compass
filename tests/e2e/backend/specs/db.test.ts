import {expect, test } from '@playwright/test';
import { createSupabaseDirectClient } from "../../../../backend/shared/src/supabase/init";

test('View database', async () => {
    const dbClient = createSupabaseDirectClient()
    const queryUserID = `
        SELECT p.*
        FROM public.profiles AS p
        WHERE id = $1
    `;

    const queryTableColumns = `
        SELECT
            column_name,
            data_type,
            character_maximum_length,
            is_nullable,
            column_default
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name ='profiles'
        ORDER BY ordinal_position;
    `;

    const queryTableColumnsNullable = `
        SELECT
            column_name,
            data_type,
            character_maximum_length,
            column_default
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name =$1
        AND is_nullable = $2
        ORDER BY ordinal_position;
    `;

    const queryInsertUserProfile = `
        INSERT INTO profiles (name, username)
        VALUES ($1, $2)
        RETURNING *;
    `;

    const queryInsertUsers = `
        INSERT INTO profiles (id, bio)
        VALUES ($1, $2)
        RETURNING *;
    `;


    const rows = await dbClient.query(
        queryInsertUsers,
        [
            'JFTZOhrBagPk',
            {
                "type": "doc",
                "content": [
                    {
                        "type": "paragraph",
                        "content": [
                            {
                                "text": "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
                                "type": "text"
                            }
                        ]
                    }
                ]
            }
        ]
    )

    console.log("Type of: ",typeof(rows));
    console.log("Number of rows: ",rows.length);
    
    console.log(JSON.stringify(await rows, null, 2));

    
})