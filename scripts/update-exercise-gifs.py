#!/usr/bin/env python3
"""
Script para atualizar URLs de GIFs dos exercícios no banco de dados.
Usa URLs de GIFs de exercícios de fontes públicas.
"""

import os
import sys

# Adicionar o diretório raiz ao path para importar módulos
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Mapeamento de exercícios para URLs de GIFs
# Usando GIFs de demonstração de exercícios de fontes públicas
EXERCISE_GIFS = {
    # Treino A - Peito e Tríceps
    "Supino Reto Barra": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663028771387/bench-press.gif",
    "Supino Inclinado Barra": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663028771387/incline-bench-press.gif",
    "Supino Inclinado Halteres": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663028771387/incline-dumbbell-press.gif",
    "Crucifixo Reto Halteres": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663028771387/dumbbell-fly.gif",
    "Peck Deck": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663028771387/pec-deck.gif",
    "Tríceps Testa Barra W": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663028771387/skull-crusher.gif",
    "Tríceps Francês Halteres": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663028771387/overhead-tricep-extension.gif",
    "Tríceps Corda": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663028771387/tricep-rope-pushdown.gif",
    
    # Treino B - Costas e Bíceps
    "Puxador Costas Frente Pegada Aberta": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663028771387/lat-pulldown-wide.gif",
    "Puxador Costas Frente Triângulo": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663028771387/lat-pulldown-close.gif",
    "Remada Articulada Pronada": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663028771387/t-bar-row.gif",
    "Remada Baixa Triângulo": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663028771387/seated-cable-row.gif",
    "Crucifixo Inverso na Máquina": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663028771387/reverse-pec-deck.gif",
    "Rosca Martelo": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663028771387/hammer-curl.gif",
    "Rosca Direta Barra Reta": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663028771387/barbell-curl.gif",
    "Tríceps Pulley Barra Reta": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663028771387/tricep-pushdown.gif",
    
    # Treino C - Pernas
    "Agachamento Livre": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663028771387/barbell-squat.gif",
    "Leg Press 45°": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663028771387/leg-press.gif",
    "Cadeira Extensora": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663028771387/leg-extension.gif",
    "Mesa Flexora": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663028771387/leg-curl.gif",
    "Stiff": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663028771387/stiff-leg-deadlift.gif",
    "Panturrilha no Smith": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663028771387/smith-calf-raise.gif",
    "Panturrilha Sentado": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663028771387/seated-calf-raise.gif",
    "Abdominal Infra na Barra": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663028771387/hanging-leg-raise.gif",
    
    # Treino D - Ombros e Trapézio
    "Desenvolvimento com Barra": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663028771387/overhead-press.gif",
    "Desenvolvimento com Halteres": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663028771387/dumbbell-shoulder-press.gif",
    "Elevação Lateral": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663028771387/lateral-raise.gif",
    "Elevação Frontal": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663028771387/front-raise.gif",
    "Crucifixo Inverso": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663028771387/reverse-fly.gif",
    "Encolhimento com Barra": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663028771387/barbell-shrug.gif",
    "Encolhimento com Halteres": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663028771387/dumbbell-shrug.gif",
    "Abdominal Supra no Solo": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663028771387/crunch.gif",
    
    # Treino E - Peito e Tríceps (variação)
    "Supino Inclinado com Halteres": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663028771387/incline-dumbbell-press-2.gif",
    "Supino Reto com Halteres": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663028771387/dumbbell-bench-press.gif",
    "Crucifixo Inclinado": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663028771387/incline-dumbbell-fly.gif",
    "Crossover": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663028771387/cable-crossover.gif",
    "Tríceps Testa com Halteres": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663028771387/dumbbell-skull-crusher.gif",
    "Tríceps Mergulho": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663028771387/dips.gif",
    "Tríceps Coice": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663028771387/tricep-kickback.gif",
    
    # Treino F - Costas e Bíceps (variação)
    "Barra Fixa": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663028771387/pull-up.gif",
    "Pulldown Pegada Supinada": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663028771387/underhand-pulldown.gif",
    "Remada Curvada com Barra": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663028771387/bent-over-row.gif",
    "Remada Unilateral com Halter": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663028771387/one-arm-row.gif",
    "Rosca Direta com Halteres": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663028771387/dumbbell-curl.gif",
    "Rosca Concentrada": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663028771387/concentration-curl.gif",
}

def update_gifs():
    """Atualiza as URLs dos GIFs no banco de dados"""
    import mysql.connector
    from urllib.parse import urlparse
    
    # Conectar ao banco de dados
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        print("❌ DATABASE_URL não encontrada!")
        return
    
    # Parse da URL do banco
    parsed = urlparse(db_url)
    
    try:
        conn = mysql.connector.connect(
            host=parsed.hostname,
            port=parsed.port or 3306,
            user=parsed.username,
            password=parsed.password,
            database=parsed.path.lstrip('/')
        )
        cursor = conn.cursor()
        
        print("✅ Conectado ao banco de dados")
        print(f"📊 Atualizando {len(EXERCISE_GIFS)} exercícios com GIFs...\n")
        
        updated = 0
        not_found = []
        
        for exercise_name, gif_url in EXERCISE_GIFS.items():
            # Atualizar o exercício
            cursor.execute(
                "UPDATE exercises SET gifUrl = %s WHERE name = %s",
                (gif_url, exercise_name)
            )
            
            if cursor.rowcount > 0:
                print(f"✅ {exercise_name}")
                updated += 1
            else:
                print(f"⚠️  {exercise_name} - não encontrado no banco")
                not_found.append(exercise_name)
        
        conn.commit()
        
        print(f"\n📈 Resumo:")
        print(f"   ✅ Atualizados: {updated}")
        print(f"   ⚠️  Não encontrados: {len(not_found)}")
        
        if not_found:
            print(f"\n⚠️  Exercícios não encontrados:")
            for name in not_found:
                print(f"   - {name}")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Erro: {e}")
        return

if __name__ == "__main__":
    update_gifs()
