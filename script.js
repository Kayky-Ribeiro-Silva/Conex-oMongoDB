/* Selectores de Elementos */
const palavraInput = document.getElementById("palavra_input");
const listaPalavras = document.getElementById("lista_palavras");
const revisoesContainer = document.getElementById("revisoesContainer");
const form = document.getElementById("documentForm");
const output = document.getElementById("jsonOutput");
const copyBtn = document.getElementById("copyJsonBtn");
const gerarPdfBtn = document.getElementById("gerarPdfBtn");

let palavras = [];

/* Funções de Manipulação do Formulário */

/* Adiciona Palavras-Chave ao Pressionar Enter */
palavraInput.addEventListener("keypress", e =>{
    if(e.key === "Enter"){
        e.preventDefault();
        const palavra = palavraInput.value.trim();
        if(palavra && !palavra.include(palavra)){
            palavra.push(palavra);
            atualizarPalavras();
            palavraInput.value = "";
        }
    }
});

/* Atualiza a Lista de Palavras-Chave na tela e permite a remoção */
function atualizarPalavras(){
    listaPalavras.innerHTML();
    palavras.forEach(p =>{
        const li = document.createElement("li");
        li.textContent = p
        li.addEventListener("click", () =>{
            palavras = palavras.filter(item => item !== p);
            atualizarPalavras();
        });
        listaPalavras.appendChild(li);
    });
}

/* Adicionar Dinamicamente os campos para uma nova revisão */
document.getElementById("addRevisão").addEventListener("click", ()  =>{
    const div = document.createElement("div");
    div.classList.add("revisão");
    div.innerHTML = `
        <label>Data:</label>
        <input type="datetime-local" class="data_revisao" required>
        <label>Revisado por:</label>
        <input type="texto" class="revisado_por" required>
        <label>Comentário:</label>
        <input type="texto" class="comentario_revisao" required>
    `;
    revisoesContainer.appendChild(div);
});

/* Função central para Coletar os dados do Formulario */
/* Reutilizado para gerar tanto o JSON quanto o PDF */
function construirDocumento(){
    /* coletar todas as revisões adicionadas */
    const revisoesInput = Array.from(document.querySelectorAll(".revisao"));
    const revisoes = revisoesInput.map(div => ({
        data: div.querySelector(" .data_revisao").value,
        revisado_por: div.querySelector(".revisado_por").value,
        comentario: div.querySelector(".comentario_revisao").value
    }));

    const document = {
        titulo: document.getElementById("titulo").value,
        tipo: document.getElementById("tipo").value,
        ano: parseInt(document.getElementById("ano").value),
        status: document.getElementById("status").value,
        data_envio: document.getElementById("data_envio").value,
        resposavel:{
            nome: document.getElementById("nome_responsavel").value,
            cargo: document.getElementById("cargo_responsavel").values,
            departamento: document.getElementById("departamento_responsavel").values
        },
        palavras_chaves: palavras,
        revisoes: revisoes,
    };

    return document;
}

/* Lógica de Gerção (JSON E PDF) */
/* Evento para o botão de gerar o relatório em PDF */
gerarPdfBtn.addEventListener("click", () =>{
    const doc = construirDocumento();

    /* Validação para garantir que o formulário foi preenchido */
    if(!doc.titulo){
        alert("Por favor, preencher o formulário antes de gerar o PDF.");
        return;
    }

    /* Acessa a biblioteca jsPDF que foi carregada no HTML */
    const { jsPDF } = window.jsPDF;
    const pdf = new jsPDF();

    let y = 20; /* Posição vertical inicial no documento pdf */

    /* Adicionar o conteúda ao PDF */
    pdf.setFontSize(18);
    pdf.text(doc.titulo, 105, y, { align: 'center' });
    y += 15;

    pdf.setFontSize(12);
    pdf.text(`Tipo: ${doc.tipo}`, 20, y);
    pdf.text(`Ano: ${doc.ano}`, 120, y);
    y += 7;
    pdf.text(`Status: ${doc.status}`, 20, y,);
    pdf.text(`Data de Envio: ${new Date(doc.data_envio).toLocaleString('pt-BR')}`, 120, y);
    y += 15;

    /* Seção do Responsavel */
    pdf+setFontSize(14);
    pdf.text("Responsavel", 20, y);
    y += 7;
    pdf.setFontSize(12);
    pdf.text(`- Nome: ${doc.resposavel.nome}`, 25, y);
    y += 7;
    pdf.text(`- cargo: ${doc.resposavel.cargo}`, 25, y);
    y += 7;
    pdf.text(`- Departamneto: ${doc.resposavel.departamento}`, 25, y);
    y += 15;
    
    /* Seção de Palavra-Chaves */
    pdf.setFontSize(14);
    pdf.text("Palavras-chave", 20, y);
    y += 7;
    pdf.setFontSize(12);
    pdf.text(doc.palavras_chaves.join(', '), 25, y);
    y += 15;

    /* Seção de Revisão com quebra de linha automática */
    pdf.setFontSize(14);
    pdf.text("Revisões", 20, y);
    y += 7;
    pdf.setFontSize(12);

    if(doc.revisoes.length > 0){
        doc.revisoes.forEach((rev, index) => {
            if(index > 0) y += 5;

            pdf.text(` Revisões ${index + 1}:`, 25, y);
            y += 7;
            pdf.text(`- Data: ${new Date(rev.data).toLocaleDateString('pt-BR')}`, 30, y);
            y += 7;
            pdf.text(`- Revisor: ${rev.revisado_por}`, 30, y);
            y += 7;

            /* Lógica de quebra de linha para o comentário */
            const maxWidth = 165; /* Largura máxima do texto na página */
            const comentarioLines = pdf.splitTextToSize(`- Comentário: ${rev.comentario}`, maxWidth);

            pdf.text(comentarioLines, 30, y);

            /* Atualiza a posição 'y' com base na quantidade de linhas do comnetário */
            y += (comentarioLines.length * 5) + 5;
        });
    } else{
        pdf.text("Nenhuma revisão adicionada.", 25, y);
    }

    /* Inicia o download do arquivo PDF gerado */
    pdf.save(`${doc.titulo.replace(/ /g, '_')}.pdf`)
});

/* Função de copiar json */
copyBtn.addEventListener("click", () =>{
    const textoParaCopiar = output.textContent;

    if(textoParaCopiar.trim() === ""){
        alert("Gere um documento primeiro para poder copiar!");
        return;
    }

    navigator.clipboard.writeText(textoParaCopiar).then(() => {
        const textoOriginal = copyBtn.textContent;
        copyBtn.textContent = "✅ Copiado!";
        setTimeout(() =>{
            copyBtn.textContent = textoOriginal;
        }, 2000);
    }).catch(err =>{
        console.error("Falha ao copiar o texto: ", err);
        alert("Ocorreu um erro ao tentar copiar.");
    }); 
});

/* Gera JSON e envia para o back-end ao submeter o formulário */
form.addEventListener("submit", async e =>{
    e.preventDefault();

    /* 1. Constrói oj objeto do documento com antes */
    const documento = construirDocumento();

    /* 2. Exibe o JSON na tela (para manter a funcionalidade original) */
    const documentMongo = JSON.parse(JSON.stringify(documento));
    documentMongo.data_envio = {"$date": documento.data_envio };
    documentMongo.revisoes.forEach(rev => {
        rev.data = {"$date": rev.data};
    });
    output.textContent = JSON.stringify(documentMongo, null, 2);

    /* 3. Envio os dados para o back end */
    try{
        const reponse = await fetch('http://localhost:3000/salvar-relatorio', {
            method: 'POST',
            headers:{
                'Content-type':'application/json',
            },
            /* Enviamos o objeto 'documento' original, sem o formato "$date" */
            body: JSON.stringify(documento),
        });

        const result = await reponse.json();

        if(reponse.ok){
            alert('Relatório salvo no banco de dados com sucesso');
        }else{
            alert('Falah ao salvar no banco de dados: ' + result.message);
        }
    }catch(error){
        console.error('Erro de comunicação com o servidor: ', error);
        alert('Não foi possível conectar ao servidor. Verifique se o Back-end está rodando.');
    }
});