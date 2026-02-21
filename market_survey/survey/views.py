from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from .models import Survey, Question, Choice, Respondent, Response
from openpyxl import Workbook
from django.http import HttpResponse, FileResponse,JsonResponse
import json
import qrcode
from io import BytesIO
import base64
from django.urls import reverse
from wordcloud import WordCloud
from collections import Counter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
import tempfile
from .decorators import group_required
from django.contrib.auth.decorators import login_required
from django.http import Http404

def get_survey_or_404(request, survey_id):
    user = request.user

    if user.is_staff or user.is_superuser:
        return get_object_or_404(Survey, id=survey_id)

    return get_object_or_404(Survey, id=survey_id, owner=user)
def get_public_survey_or_404(survey_id):
    return get_object_or_404(Survey, id=survey_id)


def generate_wordcloud_and_stats(text_list):
    """Retourne image base64 et top words (liste (mot, count))."""
    full_text = " ".join(text_list).lower()
    if not full_text.strip():
        return None, []
    wc = WordCloud(width=600, height=400, background_color="white").generate(full_text)
    buffer = BytesIO()
    wc.to_image().save(buffer, format="PNG")
    img_b64 = base64.b64encode(buffer.getvalue()).decode()

    # Statistiques de fréquence (mots > 3 lettres)
    words = [w for w in full_text.split() if len(w) > 3]
    freq = Counter(words).most_common(10)
    return img_b64, freq


def generate_qr_for_survey(request, survey):
    """Retourne data URI PNG du QR code pointant vers la page take_survey."""
    base_url = request.build_absolute_uri('/')[:-1]  # ex: http://127.0.0.1:8000
    # accepte survey comme objet ou id
    survey_id = survey.id if hasattr(survey, 'id') else int(survey)
    qr_url = base_url + reverse('take_survey', args=[survey_id])

    qr = qrcode.make(qr_url)
    buffer = BytesIO()
    qr.save(buffer, format="PNG")
    qr_base64 = base64.b64encode(buffer.getvalue()).decode()
    return f"data:image/png;base64,{qr_base64}"

@login_required
def survey_list(request):
    user = request.user

    if user.is_staff or user.is_superuser:
        surveys = Survey.objects.all()
    else:
        surveys = Survey.objects.filter(owner=user)

    return render(request, 'survey/survey_list.html', {'surveys': surveys})

@login_required
def survey_create(request):
    if request.method == "POST":
        title = request.POST.get("title", "").strip()
        description = request.POST.get("description", "").strip()
        survey = Survey.objects.create(
        title=title,
        description=description,
        owner=request.user
        )

        question_texts = request.POST.getlist("question_text[]")
        question_types = request.POST.getlist('question_types[]')

        for i, text in enumerate(question_texts):
            if not text or not text.strip():
                continue
            q_type = question_types[i] if i < len(question_types) else 'text'
            question = Question.objects.create(survey=survey, text=text.strip(), question_type=q_type)

            if q_type in ['single', 'multiple']:
                # on récupère les inputs choices_{i}[]
                choices = request.POST.getlist(f'choices_{i}[]')
                for choice_text in choices:
                    if choice_text and choice_text.strip():
                        Choice.objects.create(question=question, text=choice_text.strip())

        return redirect('survey_list')

    return render(request, 'survey/survey_create.html')


def survey_summary(request, survey_id):
    survey = get_survey_or_404(request, survey_id)

    respondents_qs = Respondent.objects.filter(survey=survey)

    chart_data = []
    for question in survey.questions.all():
        entry = {"text": question.text, "type": question.question_type}

        if question.question_type in ['single', 'multiple']:
            labels, values = [], []
            for choice in question.choices.all():
                labels.append(choice.text)
                count = Response.objects.filter(
                    question=question,
                    respondent__in=respondents_qs,
                    selected_choices=choice
                ).count()
                values.append(count)
            entry["labels"], entry["data"] = labels, values
        else:
            answers = Response.objects.filter(
                question=question,
                respondent__in=respondents_qs
            ).values_list('answer_text', flat=True)
            entry["answers"] = [a for a in answers if a and str(a).strip()]

        chart_data.append(entry)

    context = {
        "survey": survey,
        "chart_data": json.dumps(chart_data, ensure_ascii=False),
        "respondents": respondents_qs,
        "qr_code": generate_qr_for_survey(request, survey),
    }

    text_answers = [
        r.answer_text.strip()
        for r in Response.objects.filter(
            question__survey=survey,
            question__question_type='text',
            respondent__in=respondents_qs
        )
        if r.answer_text and r.answer_text.strip()
    ]

    if text_answers:
        wc_image, top_words = generate_wordcloud_and_stats(text_answers)
        if wc_image:
            context["wordcloud_img"] = f"data:image/png;base64,{wc_image}"
            context["top_words"] = top_words
    else:
        context["wordcloud_img"] = None
        context["top_words"] = []

    return render(request, "survey/survey_summary.html", context)



def export_survey_pdf(request, survey_id):
    survey = get_survey_or_404(request, survey_id)
    responses = Response.objects.filter(question__survey=survey).select_related('respondent', 'question')
    respondents = Respondent.objects.filter(survey=survey)

    styles = getSampleStyleSheet()
    elements = []

    elements.append(Paragraph(f"📊 Rapport d’enquête : {survey.title}", styles["Title"]))
    elements.append(Spacer(1, 12))
    elements.append(Paragraph(f"Description : {survey.description}", styles["Normal"]))
    elements.append(Spacer(1, 12))
    elements.append(Paragraph(f"Nombre d’enquêteurs : {respondents.count()}", styles["Normal"]))
    elements.append(Spacer(1, 12))

    for question in survey.questions.all():
        elements.append(Paragraph(f"• {question.text}", styles["Heading4"]))
        answers = responses.filter(question=question)
        if question.question_type == 'text':
            for ans in answers:
                if ans.answer_text:
                    elements.append(Paragraph(f"- {ans.answer_text}", styles["Normal"]))
        else:
            elements.append(Paragraph(f"({answers.count()} réponses)", styles["Normal"]))
        elements.append(Spacer(1, 10))

    temp = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
    doc = SimpleDocTemplate(temp.name, pagesize=A4)
    doc.build(elements)

    return FileResponse(open(temp.name, "rb"), as_attachment=True, filename=f"{survey.title}_rapport.pdf")


def export_survey_excel(request, survey_id):
    survey = get_survey_or_404(request, survey_id)
    respondents = Respondent.objects.filter(survey=survey).order_by('-created_at')

    wb = Workbook()
    ws = wb.active
    ws.title = f"Résumé - {survey.title}"

    ws.append(["Nom de l’enquêteur", "Date", "Question", "Réponse"])

    for respondent in respondents:
        responses = Response.objects.filter(respondent=respondent).select_related('question')
        for response in responses:
            if response.question.question_type in ["single", "multiple"]:
                selected = ", ".join([c.text for c in response.selected_choices.all()])
                answer = selected or "(Aucune sélection)"
            else:
                answer = response.answer_text or "(Vide)"

            ws.append([
                respondent.interviewer_name,
                respondent.created_at.strftime("%d/%m/%Y %H:%M"),
                response.question.text,
                answer
            ])

    response = HttpResponse(content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    filename = f"{survey.title}_résultats.xlsx"
    response['Content-Disposition'] = f'attachment; filename="{filename}"'

    wb.save(response)
    return response


def delete_all_responses(request, survey_id):
    survey = get_survey_or_404(request, survey_id)

    if request.method == "POST":
        # supprime réponses et répondants
        Response.objects.filter(respondent__survey=survey).delete()
        Respondent.objects.filter(survey=survey).delete()
        messages.success(request, f"Toutes les réponses et enquêteurs pour '{survey.title}' ont été supprimés.")
        return redirect('survey_summary', survey_id=survey.id)

    return render(request, 'survey/confirm_delete_responses.html', {'survey': survey})


def delete_respondent(request, respondent_id):
    respondent = get_object_or_404(Respondent, id=respondent_id)

    # Sécurité : vérifier que l'utilisateur possède l'enquête
    survey = respondent.survey
    if not (request.user.is_staff or request.user.is_superuser or survey.owner == request.user):
        raise Http404
    if request.method == "POST":
        Response.objects.filter(respondent=respondent).delete()
        respondent.delete()
        messages.success(request, f"L'enquêteur {respondent.interviewer_name} et ses réponses ont été supprimés.")
        return redirect('survey_summary', survey_id=survey.id)

    # IMPORTANT : on passe aussi 'survey' pour que le template puisse faire {% url 'survey_summary' survey.id %}
    return render(request, 'survey/confirm_delete_respondent.html', {'respondent': respondent, 'survey': survey})


def survey_detail(request, survey_id):
    survey = get_survey_or_404(request, survey_id)
    questions = survey.questions.all()
    return render(request, 'survey/detail.html', {'survey': survey, 'questions': questions})

def take_survey(request, survey_id):
    # On récupère le sondage (vue publique, pas besoin d'être owner)
    survey = get_public_survey_or_404(survey_id)
    questions = survey.questions.all()

    if request.method == "POST":
        # On récupère le nom de l'enquêteur. 
        # Si vide (cas du lien public), on met "Réponse en ligne"
        interviewer_name = request.POST.get('interviewer_name', '').strip()
        if not interviewer_name:
            interviewer_name = "Réponse en ligne"

        # Création du répondant
        respondent = Respondent.objects.create(
            survey=survey,
            interviewer_name=interviewer_name,
            # Très important : on lie la réponse au compte de celui qui a créé le sondage
            # même si le répondant n'est pas connecté
            created_by=survey.owner 
        )

        for question in questions:
            field_name = f'question_{question.id}'

            if question.question_type in ['single', 'multiple']:
                selected_choices = request.POST.getlist(field_name)
                if selected_choices:
                    response_obj = Response.objects.create(
                        respondent=respondent,
                        question=question
                    )
                    for choice_id in selected_choices:
                        try:
                            choice = Choice.objects.get(id=int(choice_id))
                            response_obj.selected_choices.add(choice)
                        except (Choice.DoesNotExist, ValueError):
                            continue
            else:
                answer_text = request.POST.get(field_name, '').strip()
                if answer_text:
                    Response.objects.create(
                        respondent=respondent,
                        question=question,
                        answer_text=answer_text
                    )

        # Si c'est une requête API (venant de React), on renvoie du JSON
        if request.headers.get('Content-Type') == 'application/json' or request.path.startswith('/api/'):
             return JsonResponse({
                 "status": "success", 
                 "respondent_id": respondent.id,
                 "interviewer_name": interviewer_name
             })

        # Sinon, rendu classique Django (fallback)
        return render(request, 'survey/thanks.html', {'survey': survey})

    return render(request, 'survey/take_survey.html', {
        'survey': survey,
        'questions': questions
    })



def survey_edit(request, survey_id):
    survey = get_survey_or_404(request, survey_id)
    
    # 1. On vérifie s'il y a déjà des réponses
    has_responses = survey.respondents.exists()

    if request.method == "POST":
        # Le titre et la description sont toujours modifiables
        survey.title = request.POST.get("title", "").strip()
        survey.description = request.POST.get("description", "").strip()
        survey.save()

        # 2. Si des réponses existent, on s'arrête ici pour les questions
        if has_responses:
            messages.warning(request, "Le titre a été mis à jour, mais les questions sont verrouillées car des réponses existent déjà.")
            return redirect("survey_detail", survey_id=survey.id)

        # 3. Si PAS de réponses, on procède à la modification complète (ton code actuel)
        # Mise à jour / suppression des questions existantes
        for question in survey.questions.all():
            text_key = f"question_text_existing_{question.id}"
            type_key = f"question_type_existing_{question.id}"

            if text_key not in request.POST:
                question.delete()
                continue

            question.text = request.POST.get(text_key, question.text).strip()
            question.question_type = request.POST.get(type_key, question.question_type)
            question.save()

            if question.question_type in ["single", "multiple"]:
                question.choices.all().delete()
                for c in request.POST.getlist(f"choices_existing_{question.id}[]"):
                    if c and c.strip():
                        Choice.objects.create(question=question, text=c.strip())

        # Nouvelles questions
        new_texts = request.POST.getlist("new_question_text[]")
        new_types = request.POST.getlist("new_question_type[]")

        for i, text in enumerate(new_texts):
            if not text or not text.strip():
                continue
            q = Question.objects.create(
                survey=survey,
                text=text.strip(),
                question_type=new_types[i] if i < len(new_types) else 'text'
            )
            if new_types and new_types[i] in ["single", "multiple"]:
                for c in request.POST.getlist(f"new_choices_{i}[]"):
                    if c and c.strip():
                        Choice.objects.create(question=q, text=c.strip())

        return redirect("survey_detail", survey_id=survey.id)

    # On passe 'has_responses' au template pour pouvoir griser les champs en HTML
    return render(request, "survey/survey_edit.html", {
        "survey": survey, 
        "has_responses": has_responses
    })

def survey_delete(request, survey_id):
    survey = get_survey_or_404(request, survey_id)
    if request.method == "POST":
        deleted_title = survey.title
        survey.delete()
        return render(request, 'survey/survey_deleted.html', {'deleted_title': deleted_title})

    return render(request, 'survey/survey_confirm_delete.html', {'survey': survey})


def survey_thanks(request, survey_id):
    survey = get_survey_or_404(request, survey_id)
    return render(request, 'survey/thanks.html', {'survey': survey})
